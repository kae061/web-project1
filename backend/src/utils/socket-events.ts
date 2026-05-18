import { Server, Socket } from 'socket.io';
import User from '../models/User';
import Chat from '../models/Chat';
import Message from '../models/Message';

// Keep track of online users: userId -> socketId
const userSocketMap = new Map<string, string>();

export const setupSocketEvents = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`[Socket] User ${userId} connected with socket ${socket.id}`);

      // Update user status to online
      await User.findByIdAndUpdate(userId, { status: 'online' });
      io.emit('user:online', userId);

      // Join rooms for all user's chats
      const chats = await Chat.find({ participants: userId });
      chats.forEach((chat) => {
        socket.join(`chat:${chat._id}`);
      });

      // Join rooms for all user's groups
      const Group = require('../models/Group').default;
      const groups = await Group.find({ members: userId });
      groups.forEach((group: any) => {
        socket.join(`group:${group._id}`);
      });

      // Join rooms for all user's supergroups
      const SuperGroup = require('../models/SuperGroup').default;
      const sgs = await SuperGroup.find({ members: userId });
      sgs.forEach((sg: any) => {
        socket.join(`supergroup:${sg._id}`);
      });

      // Join personal room for targeted notifications
      socket.join(`user:${userId}`);
    }

    socket.on('chat:join', (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('group:join', (groupId: string) => {
      socket.join(`group:${groupId}`);
      console.log(`[Socket] User joined group room: group:${groupId}`);
    });

    socket.on('supergroup:join', (sgId: string) => {
      socket.join(`supergroup:${sgId}`);
      console.log(`[Socket] User joined supergroup room: supergroup:${sgId}`);
    });

    // --- Message Events ---

    // --- Message Events ---
    // Handled via REST API


    socket.on('typing', (data: { chatId: string; recipientId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing', {
        userId,
        chatId: data.chatId,
      });
    });

    socket.on('message:read', async (data: { messageId: string; chatId: string }) => {
      try {
        await Message.findByIdAndUpdate(data.messageId, {
          $addToSet: { readBy: userId },
        });

        io.to(`chat:${data.chatId}`).emit('message:read', {
          messageId: data.messageId,
          userId,
        });
      } catch (error) {
        console.error('[Socket] message:read error:', error);
      }
    });

    // --- Disconnect ---

    socket.on('disconnect', async () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`[Socket] User ${userId} disconnected`);

        // Update user status to offline
        await User.findByIdAndUpdate(userId, { 
          status: 'offline',
          lastSeen: new Date()
        });
        io.emit('user:offline', userId);
      }
    });
  });
};
