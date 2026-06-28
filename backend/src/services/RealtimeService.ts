import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface SocketUser {
  userId: string;
  socketId: string;
}

export class RealtimeService {
  private io: Server;
  private users: Map<string, SocketUser> = new Map();

  constructor(httpServer: HTTPServer, private db: Pool) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`User connected: ${socket.id}`);

      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
          ) as any;
          this.users.set(socket.id, { userId: decoded.userId, socketId: socket.id });
        }
      } catch (err) {
        logger.warn(`Socket auth failed for ${socket.id}`);
      }

      socket.on('review:join', async (reviewId: string) => {
        socket.join(`review:${reviewId}`);
        const user = this.users.get(socket.id);
        this.io.to(`review:${reviewId}`).emit('review:user:join', {
          userId: user?.userId,
          socketId: socket.id
        });
      });

      socket.on('review:leave', (reviewId: string) => {
        socket.leave(`review:${reviewId}`);
      });

      socket.on('review:code:change', (data: { reviewId: string; filePath: string; content: string; cursor?: any }) => {
        const user = this.users.get(socket.id);
        socket.to(`review:${data.reviewId}`).emit('review:code:change', {
          ...data,
          userId: user?.userId
        });
      });

      socket.on('review:comment:add', async (data: { reviewId: string; comment: any }) => {
        const user = this.users.get(socket.id);
        this.io.to(`review:${data.reviewId}`).emit('review:comment:add', {
          ...data.comment,
          authorId: user?.userId
        });
      });

      socket.on('session:join', (sessionId: string) => {
        socket.join(`session:${sessionId}`);
        const user = this.users.get(socket.id);
        this.io.to(`session:${sessionId}`).emit('session:user:join', {
          userId: user?.userId,
          socketId: socket.id
        });
      });

      socket.on('session:leave', (sessionId: string) => {
        socket.leave(`session:${sessionId}`);
      });

      socket.on('session:code:change', (data: { sessionId: string; content: string; cursor?: any }) => {
        const user = this.users.get(socket.id);
        socket.to(`session:${data.sessionId}`).emit('session:code:change', {
          ...data,
          userId: user?.userId
        });
      });

      socket.on('session:cursor:move', (data: { sessionId: string; cursor: any }) => {
        const user = this.users.get(socket.id);
        socket.to(`session:${data.sessionId}`).emit('session:cursor:move', {
          ...data.cursor,
          userId: user?.userId
        });
      });

      socket.on('session:terminal:output', (data: { sessionId: string; output: string }) => {
        socket.to(`session:${data.sessionId}`).emit('session:terminal:output', data.output);
      });

      socket.on('session:chat:message', (data: { sessionId: string; message: string }) => {
        const user = this.users.get(socket.id);
        this.io.to(`session:${data.sessionId}`).emit('session:chat:message', {
          message: data.message,
          userId: user?.userId,
          timestamp: new Date()
        });
      });

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
        this.users.delete(socket.id);
      });
    });
  }

  getIO(): Server {
    return this.io;
  }
}