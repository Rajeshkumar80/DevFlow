import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Pool } from 'pg';

export function createAuthRouter(db: Pool) {
  const router = Router();
  const authService = new AuthService(db);

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, username, password, full_name } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
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

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const accessToken = await authService.refreshAccessToken(refreshToken);
      res.status(200).json({ accessToken });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  router.post('/logout', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Logged out successfully' });
  });

  return router;
}