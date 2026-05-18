import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

// TypeScript interface for req.user
export interface AuthUser {
  id: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * authenticateToken middleware
 * Gets token from Authorization: Bearer header.
 * Verifies with verifyAccessToken().
 * Sets req.user = { id } if valid, returns 401 if invalid.
 */
const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access token is missing or malformed',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload || !payload.userId) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
    return;
  }

  req.user = { id: payload.userId };
  next();
};

export default authenticateToken;
