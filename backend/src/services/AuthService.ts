import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { User, JWTPayload, LoginResponse } from '../types';

export class AuthService {
  constructor(_db?: any) {}

  async register(
    email: string,
    username: string,
    password: string,
    fullName?: string
  ): Promise<User> {
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
    });
    return user as any;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findFirst({
      where: { email, is_active: true },
    });
    if (!user) throw new Error('Invalid credentials');

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
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'devflow-super-secret-key'
    ) as JWTPayload;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = this.verifyToken(refreshToken);
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, is_active: true },
      });
      if (!user) throw new Error('User not found');
      return this.generateAccessToken(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }
}
