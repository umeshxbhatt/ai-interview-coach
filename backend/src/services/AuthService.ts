import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { IUser } from '../models/User';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '../utils/httpErrors';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { env } from '../config/environment';

export class AuthService {
  private userRepository = new UserRepository();
  private sessionRepository = new SessionRepository();

  async signup(userData: Partial<IUser>): Promise<Omit<IUser, 'password'>> {
    const { email, password, name } = userData;

    if (!email || !password || !name) {
      throw new BadRequestError('Email, password, and name are required');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Hash password with 12 rounds of bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save user
    const newUser = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    // Remove password from returned user object
    const userJson = newUser.toJSON() as any;
    delete userJson.password;
    return userJson;
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: Omit<IUser, 'password'>; accessToken: string; refreshToken: string }> {
    // Retrieve user and explicitly include password
    const user = await this.userRepository.findByEmail(email, true);
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Calculate refresh token expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session in database
    await this.sessionRepository.create({
      user: user._id as any,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    const userJson = user.toJSON() as any;
    delete userJson.password;

    return {
      user: userJson,
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify token signature and expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // 2. Fetch the session from DB
    const session = await this.sessionRepository.findByToken(refreshToken);

    // 3. Detect token reuse: if session not found, or it's already revoked
    if (!session) {
      throw new UnauthorizedError('Session not found');
    }

    if (session.isRevoked) {
      // BREACH DETECTED: This token has been used before, meaning it was hijacked!
      // Invalidate all active sessions for this user to guarantee security.
      console.warn(`⚠️ Security Breach Alert: Reused refresh token detected for User ID: ${session.user}. Revoking all sessions.`);
      await this.sessionRepository.revokeAllForUser(session.user);
      throw new ForbiddenError('Compromised session. Please sign in again.');
    }

    // 4. Generate new pair of tokens (Refresh Token Rotation)
    const newAccessToken = signAccessToken(session.user.toString());
    const newRefreshToken = signRefreshToken(session.user.toString());

    // Calculate new expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Replace session in database
    await this.sessionRepository.replace(
      refreshToken,
      newRefreshToken,
      expiresAt,
      ipAddress,
      userAgent
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    await this.sessionRepository.revoke(refreshToken);
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    
    // For security, do not leak user existence (return success placeholder)
    if (!user) {
      return 'If your email is registered, you will receive a password reset link shortly';
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token to store in database (protects against database breach leaks)
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Expire token in 1 hour
    const tokenExpiry = new Date(Date.now() + 3600000);

    // Update user record
    await this.userRepository.update(user.id, {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: tokenExpiry,
    });

    // In a production app, we would send this link via email.
    // For development, we print it to the server console to allow verification.
    console.log(`\n🔑 PASSWORD RESET LINK (DEV ONLY):\nhttp://localhost:5173/reset-password/${resetToken}\n`);

    return 'If your email is registered, you will receive a password reset link shortly';
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash token to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.userRepository.findByResetToken(hashedToken);
    if (!user) {
      throw new BadRequestError('Password reset link is invalid or has expired');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user and clear reset tokens
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // Invalidate all active sessions for security after password change
    await this.sessionRepository.revokeAllForUser(user.id);
  }

  async getCurrentUser(userId: string): Promise<Omit<IUser, 'password'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User session expired or user not found');
    }
    return user.toJSON() as any;
  }
}
