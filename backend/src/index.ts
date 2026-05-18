import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chats';
import uploadRoutes from './routes/upload';
import callRoutes from './routes/calls';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import superGroupRoutes from './routes/supergroups';
import { setupSocketEvents } from './utils/socket-events';
import { setupCallSignaling } from './utils/callSignaling';

const PORT = parseInt(process.env.PORT || '3333', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── Initialize Express App ─────────────────────────────────────────────────

const app = express();

// ─── Create HTTP Server ──────────────────────────────────────────────────────

const httpServer = http.createServer(app);

// ─── Setup Socket.io ─────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3333'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Initialize real-time socket events
setupSocketEvents(io);
setupCallSignaling(io);

export { io };

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3333'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'KaeApp API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/supergroups', superGroupRoutes);


// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GlobalError]', err.message, err.stack);
  
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});


// ─── Start Server ────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`🚀 KaeApp server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
