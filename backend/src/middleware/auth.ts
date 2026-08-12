import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/httpErrors';

// Extend Express Request interface to include the authenticated user payload
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const auth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined = undefined;
    console.log('[AUTH] AUTH ME REQUEST received. Cookies present:', !!req.cookies, 'accessToken present:', !!req.cookies?.accessToken);

    // 1. Check for token in cookies (preferred web authentication)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Check for token in Authorization header (standard Bearer scheme fallback)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing. Please sign in.');
    }

    // 3. Verify access token
    const decoded = verifyAccessToken(token);

    // 4. Attach verified user profile payload to request context
    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Session invalid or expired. Please sign in again.'));
  }
};
