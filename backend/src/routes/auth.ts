import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many registration attempts. Try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

export function createAuthRouter(db: any) {
  const router = Router();
  const authService = new AuthService(db);

  router.post('/register', registerLimiter, async (req: Request, res: Response) => {
    try {
      const { email, username, password, full_name } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await authService.register(email, username, password, full_name);
      res.status(201).json({ user });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Email or username already exists' });
      }
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await authService.login(email, password);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({ user: result.user });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const accessToken = await authService.refreshAccessToken(refreshToken);

      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        AuthService.blacklistToken(refreshToken);
      }
      clearAuthCookies(res);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch {
      clearAuthCookies(res);
      res.status(200).json({ message: 'Logged out successfully' });
    }
  });

  return router;
}
