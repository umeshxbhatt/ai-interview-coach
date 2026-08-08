import { Session, ISession } from '../models/Session';
import { Types } from 'mongoose';

export class SessionRepository {
  async create(sessionData: Partial<ISession>): Promise<ISession> {
    return await Session.create(sessionData);
  }

  async findByToken(refreshToken: string): Promise<ISession | null> {
    return await Session.findOne({ refreshToken }).exec();
  }

  async findByTokenWithUser(refreshToken: string): Promise<ISession | null> {
    return await Session.findOne({ refreshToken }).populate('user').exec();
  }

  async revoke(refreshToken: string): Promise<ISession | null> {
    return await Session.findOneAndUpdate(
      { refreshToken },
      { isRevoked: true },
      { new: true }
    ).exec();
  }

  async revokeAllForUser(userId: string | Types.ObjectId): Promise<void> {
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    await Session.updateMany({ user: userObjId }, { isRevoked: true }).exec();
  }

  async replace(
    oldToken: string,
    newToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ISession | null> {
    // Find the old session first
    const oldSession = await Session.findOne({ refreshToken: oldToken }).exec();
    if (!oldSession) return null;

    // Revoke old session and log replacement token
    oldSession.isRevoked = true;
    oldSession.replacedByToken = newToken;
    await oldSession.save();

    // Create the new session inheriting the user reference
    return await Session.create({
      user: oldSession.user,
      refreshToken: newToken,
      expiresAt,
      ipAddress,
      userAgent,
    });
  }
}
