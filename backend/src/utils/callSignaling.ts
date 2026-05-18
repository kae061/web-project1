import { Server, Socket } from 'socket.io';

export const setupCallSignaling = (io: Server) => {
  // Map to store active calls and their socket IDs: userId -> socketId
  const userSocketMap = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`[Socket Call] User ${userId} connected. Socket ID: ${socket.id}`);
      console.log(`Active users: ${userSocketMap.size}`);
    }

    // --- Signaling Events ---

    // 1. Initiate call
    socket.on('call:initiate', (data: { recipientId: string; type: string; callId: string; callerName: string; callerAvatar: string }) => {
      console.log(`[Socket Call] call:initiate from ${userId} to ${data.recipientId}`);
      const recipientSocketId = userSocketMap.get(data.recipientId);
      
      if (!recipientSocketId) {
        console.log(`[Socket Call] Recipient ${data.recipientId} is offline.`);
        socket.emit('call:error', {
          callId: data.callId,
          message: 'User is offline',
        });
        return;
      }

      console.log(`[Socket Call] Routing call:incoming to ${data.recipientId}`);
      io.to(recipientSocketId).emit('call:incoming', {
        ...data,
        from: userId,
      });
    });

    // 2. Accept call (handles both 'call:accept' and 'accept-call')
    const handleAccept = (data: { callerId: string; callId: string }) => {
      console.log(`[Socket Call] call accepted by ${userId} for caller ${data.callerId}`);
      const callerSocketId = userSocketMap.get(data.callerId);
      if (callerSocketId) {
        const payload = { callId: data.callId, acceptedBy: userId };
        io.to(callerSocketId).emit('call:accepted', payload);
        io.to(callerSocketId).emit('accept-call', payload);
      }
    };
    socket.on('call:accept', handleAccept);
    socket.on('accept-call', handleAccept);

    // 3. Reject call (handles both 'call:reject' and 'reject-call')
    const handleReject = (data: { callerId: string; callId: string }) => {
      console.log(`[Socket Call] call rejected by ${userId} for caller ${data.callerId}`);
      const callerSocketId = userSocketMap.get(data.callerId);
      if (callerSocketId) {
        const payload = { callId: data.callId, rejectedBy: userId };
        io.to(callerSocketId).emit('call:rejected', payload);
        io.to(callerSocketId).emit('reject-call', payload);
      }
    };
    socket.on('call:reject', handleReject);
    socket.on('reject-call', handleReject);

    // 4. WebRTC Offer (handles both 'call:offer-sdp' and 'webrtc-offer')
    const handleOffer = (data: { to: string; offer: any; callId: string }) => {
      console.log(`[Socket Call] WebRTC Offer from ${userId} to ${data.to}`);
      const recipientSocketId = userSocketMap.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:offer-sdp', {
          from: userId,
          offer: data.offer,
          callId: data.callId,
        });
        io.to(recipientSocketId).emit('webrtc-offer', {
          from: userId,
          offer: data.offer,
          callId: data.callId,
        });
      }
    };
    socket.on('call:offer-sdp', handleOffer);
    socket.on('webrtc-offer', handleOffer);

    // 5. WebRTC Answer (handles both 'call:answer-sdp' and 'webrtc-answer')
    const handleAnswer = (data: { to: string; answer: any; callId: string }) => {
      console.log(`[Socket Call] WebRTC Answer from ${userId} to ${data.to}`);
      const callerSocketId = userSocketMap.get(data.to);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:answer-sdp', {
          from: userId,
          answer: data.answer,
          callId: data.callId,
        });
        io.to(callerSocketId).emit('webrtc-answer', {
          from: userId,
          answer: data.answer,
          callId: data.callId,
        });
      }
    };
    socket.on('call:answer-sdp', handleAnswer);
    socket.on('webrtc-answer', handleAnswer);

    // 6. ICE Candidate (handles both 'call:ice-candidate' and 'ice-candidate')
    const handleIce = (data: { to: string; candidate: any; callId: string }) => {
      const targetSocketId = userSocketMap.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ice-candidate', {
          from: userId,
          candidate: data.candidate,
          callId: data.callId,
        });
        io.to(targetSocketId).emit('ice-candidate', {
          from: userId,
          candidate: data.candidate,
          callId: data.callId,
        });
      }
    };
    socket.on('call:ice-candidate', handleIce);
    socket.on('ice-candidate', handleIce);

    // 7. End call (handles both 'call:end' and 'end-call')
    const handleEnd = (data: { to: string; callId: string }) => {
      console.log(`[Socket Call] Call ended by ${userId} with ${data.to}`);
      const targetSocketId = userSocketMap.get(data.to);
      if (targetSocketId) {
        const payload = { callId: data.callId, endedBy: userId };
        io.to(targetSocketId).emit('call:ended', payload);
        io.to(targetSocketId).emit('end-call', payload);
      }
    };
    socket.on('call:end', handleEnd);
    socket.on('end-call', handleEnd);

    // --- Disconnect ---
    socket.on('disconnect', () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`[Socket Call] User ${userId} disconnected.`);
        console.log(`Active users: ${userSocketMap.size}`);
      }
    });
  });
};
