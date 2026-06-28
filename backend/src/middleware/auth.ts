import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

function extractToken(req: Request): string | undefined {
  return req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
}

export const authMiddleware = (db: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' });
      }
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
      req.userId = decoded.userId;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

export const optionalAuthMiddleware = (db: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) return next();
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
      req.userId = decoded.userId;
    } catch (err) {
      // Token invalid, but that's okay for optional auth
    }
    next();
  };
};
