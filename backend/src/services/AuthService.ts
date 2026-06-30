import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { User, JWTPayload, LoginResponse } from '../types';

const blacklistedTokens = new Set<string>();

export class AuthService {
  constructor(_db?: any) {}

  static isBlacklisted(token: string): boolean {
    return blacklistedTokens.has(token);
  }

  static blacklistToken(token: string): void {
    blacklistedTokens.add(token);
  }

  async register(
    email: string,
    username: string,
    password: string,
    fullName?: string
  ): Promise<any> {
    if (!email || typeof email !== 'string' || email.length > 254) {
      throw new Error('Invalid email format');
    }
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 30) {
      throw new Error('Username must be 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
    if (!password || typeof password !== 'string' || password.length > 128) {
      throw new Error('Invalid password');
    }
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (!this.isStrongPassword(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        email,
        username,
        password_hash: hashedPassword,
        full_name: fullName || null,
        role: 'contributor',
      },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
    return user;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findFirst({
      where: { email, is_active: true },
    });
    if (!user) {
      await bcrypt.compare(password, '$2a$10$dummyhashfortimingattackprevention');
      throw new Error('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw new Error('Invalid credentials');

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role as any,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_active: user.is_active,
        preferences: {},
      },
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    } as any;
  }

  generateAccessToken(user: any): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken(user: any): string {
    return jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
  }

  verifyToken(token: string): JWTPayload {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      if (AuthService.isBlacklisted(refreshToken)) throw new Error('Token revoked');
      const decoded = this.verifyToken(refreshToken);
      if ((decoded as any).type !== 'refresh') throw new Error('Invalid token type');
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, is_active: true },
      });
      if (!user) throw new Error('User not found');
      return this.generateAccessToken(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isStrongPassword(password: string): boolean {
    return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password);
  }
}
