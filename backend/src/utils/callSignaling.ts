import { Server, Socket } from 'socket.io';

export const setupCallSignaling = (io: Server) => {
  // Map to store active calls and their socket IDs: userId -> socketId
  const userSocketMap = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) userSocketMap.set(userId, socket.id);

    // --- Signaling Events ---

    socket.on('call:initiate', (data: { recipientId: string; type: string; callId: string; callerName: string; callerAvatar: string }) => {
      const recipientSocketId = userSocketMap.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:incoming', {
          ...data,
          from: userId,
        });
      }
    });

    socket.on('call:accept', (data: { callerId: string; callId: string }) => {
      const callerSocketId = userSocketMap.get(data.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', {
          callId: data.callId,
          acceptedBy: userId,
        });
      }
    });

    socket.on('call:reject', (data: { callerId: string; callId: string }) => {
      const callerSocketId = userSocketMap.get(data.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:rejected', {
          callId: data.callId,
          rejectedBy: userId,
        });
      }
    });

    socket.on('call:webrtc-offer', (data: { to: string; offer: any; callId: string }) => {
      const recipientSocketId = userSocketMap.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:webrtc-offer', {
          from: userId,
          offer: data.offer,
          callId: data.callId,
        });
      }
    });

    socket.on('call:webrtc-answer', (data: { to: string; answer: any; callId: string }) => {
      const callerSocketId = userSocketMap.get(data.to);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:webrtc-answer', {
          from: userId,
          answer: data.answer,
          callId: data.callId,
        });
      }
    });

    socket.on('call:ice-candidate', (data: { to: string; candidate: any; callId: string }) => {
      const targetSocketId = userSocketMap.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ice-candidate', {
          from: userId,
          candidate: data.candidate,
          callId: data.callId,
        });
      }
    });

    socket.on('call:end', (data: { to: string; callId: string }) => {
      const targetSocketId = userSocketMap.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ended', {
          callId: data.callId,
          endedBy: userId,
        });
      }
    });

    socket.on('disconnect', () => {
      if (userId) userSocketMap.delete(userId);
    });
  });
};
