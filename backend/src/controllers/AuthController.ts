import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/auth';
import { env } from '../config/environment';

const authService = new AuthService();

// Helper cookie settings based on environment
const getCookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: maxAgeMs,
  path: '/',
});

export class AuthController {
  static async signup(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const user = await authService.signup(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Account registered successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const { user, accessToken, refreshToken } = await authService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      // Set secure HTTPOnly cookies
      // 1 hour for access token
      res.cookie('accessToken', accessToken, getCookieOptions(60 * 60 * 1000));
      // 7 days for refresh token
      res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const { accessToken, refreshToken: rotatedRefreshToken } = await authService.refresh(
        refreshToken,
        ipAddress,
        userAgent
      );

      // Re-write cookies
      res.cookie('accessToken', accessToken, getCookieOptions(60 * 60 * 1000));
      res.cookie('refreshToken', rotatedRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      res.status(200).json({
        status: 'success',
        message: 'Session refreshed successfully',
      });
    } catch (error) {
      // Clear cookies if refresh failed to enforce clean login
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      next(error);
    }
  }

  static async logout(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      await authService.logout(refreshToken);

      // Clear cookies from client
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const message = await authService.forgotPassword(email);
      res.status(200).json({
        status: 'success',
        message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      await authService.resetPassword(token, password);

      res.status(200).json({
        status: 'success',
        message: 'Password reset successful. Please sign in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Not authenticated' });
        return;
      }

      const user = await authService.getCurrentUser(userId);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: ExpressResponse, next: ExpressNextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Not authenticated' });
        return;
      }

      const updatedUser = await authService.updateUser(userId, req.body);
      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }
}
