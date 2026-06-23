import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const joinReviewRoom = (reviewId: string): void => {
  if (socket) {
    socket.emit('review:join', reviewId);
  }
};

export const leaveReviewRoom = (reviewId: string): void => {
  if (socket) {
    socket.emit('review:leave', reviewId);
  }
};

export const emitReviewCodeChange = (reviewId: string, data: {
  filePath: string;
  content: string;
  cursor?: any;
}): void => {
  if (socket) {
    socket.emit('review:code:change', { reviewId, ...data });
  }
};

export const emitReviewComment = (reviewId: string, comment: any): void => {
  if (socket) {
    socket.emit('review:comment:add', { reviewId, comment });
  }
};

export const joinSessionRoom = (sessionId: string): void => {
  if (socket) {
    socket.emit('session:join', sessionId);
  }
};

export const emitSessionCodeChange = (sessionId: string, data: {
  content: string;
  cursor?: any;
}): void => {
  if (socket) {
    socket.emit('session:code:change', { sessionId, ...data });
  }
};

export const emitSessionCursorMove = (sessionId: string, cursor: any): void => {
  if (socket) {
    socket.emit('session:cursor:move', { sessionId, cursor });
  }
};

export const emitSessionTerminalOutput = (sessionId: string, output: string): void => {
  if (socket) {
    socket.emit('session:terminal:output', { sessionId, output });
  }
};

export const emitSessionChatMessage = (sessionId: string, message: string): void => {
  if (socket) {
    socket.emit('session:chat:message', { sessionId, message });
  }
};