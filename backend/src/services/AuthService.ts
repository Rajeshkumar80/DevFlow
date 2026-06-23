import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { User, JWTPayload, LoginResponse } from '../types';

export class AuthService {
  private mockUsers: any[];

  constructor(private db: any) {
    this.mockUsers = db.users || [];
  }

  async register(email: string, username: string, password: string, fullName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      email, username,
      password_hash: hashedPassword,
      full_name: fullName || null,
      avatar_url: null,
      role: 'contributor',
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      preferences: {}
    };
    this.mockUsers.push(newUser);
    return newUser as any;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = this.mockUsers.find((u: any) => u.email === email && u.is_active);
    if (!user) throw new Error('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw new Error('Invalid credentials');

    user.last_login = new Date();

    return {
      user: {
        id: user.id, email: user.email, username: user.username,
        full_name: user.full_name, avatar_url: user.avatar_url,
        role: user.role, created_at: user.created_at,
        updated_at: user.updated_at, is_active: user.is_active,
        preferences: user.preferences || {}
      },
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    } as any;
  }

  generateAccessToken(user: any): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'devflow-super-secret-key',
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken(user: any): string {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'devflow-super-secret-key',
      { expiresIn: '30d' }
    );
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, process.env.JWT_SECRET || 'devflow-super-secret-key') as JWTPayload;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = this.verifyToken(refreshToken);
      const user = this.mockUsers.find((u: any) => u.id === decoded.userId && u.is_active);
      if (!user) throw new Error('User not found');
      return this.generateAccessToken(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }
}