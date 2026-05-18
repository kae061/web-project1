import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuthStore } from '../store/authStore';

export function useCall(currentUserId: string) {
  const { socket } = useSocket(currentUserId);
  const { user } = useAuthStore();
  
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('[useCall] Incoming call:', data);
      setIncomingCall(data);
    };

    const handleCallAccepted = (data: any) => {
      console.log('[useCall] Call accepted:', data);
      setActiveCall(data);
      setIncomingCall(null);
    };

    const handleCallRejected = () => {
      console.log('[useCall] Call rejected');
      setIncomingCall(null);
    };

    const handleCallEnded = () => {
      console.log('[useCall] Call ended');
      setActiveCall(null);
      setIncomingCall(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket]);

  const startCall = useCallback(async (participant: any, type: 'voice' | 'video') => {
    if (!participant || !socket) return;
    
    try {
      const response = await fetch('http://localhost:3333/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kaeapp_token')}`,
        },
        body: JSON.stringify({ recipientId: participant._id || participant.id, type }),
      });
      const result = await response.json();
      
      if (result.success) {
        const callData = {
          callId: result.data._id,
          recipientId: participant._id || participant.id,
          type,
          from: currentUserId,
          callerName: user?.username || 'You',
          callerAvatar: user?.avatar,
        };
        setActiveCall(callData);
        socket.emit('call:initiate', callData);
      }
    } catch (err) {
      console.error('[useCall] Failed to start call:', err);
    }
  }, [socket, currentUserId, user]);

  const acceptCall = useCallback(() => {
    if (!incomingCall || !socket) return;
    socket.emit('call:accept', { callerId: incomingCall.from, callId: incomingCall.callId });
    setActiveCall(incomingCall);
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;
    socket.emit('call:reject', { callerId: incomingCall.from, callId: incomingCall.callId });
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const endCall = useCallback(() => {
    if (!activeCall || !socket) return;
    socket.emit('call:end', { to: activeCall.recipientId || activeCall.from, callId: activeCall.callId });
    setActiveCall(null);
  }, [activeCall, socket]);

  return {
    incomingCall,
    activeCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };
}
