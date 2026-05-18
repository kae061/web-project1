import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuthStore } from '../store/authStore';

export type SimpleCallStatus = 'idle' | 'ringing' | 'ongoing' | 'ended' | 'failed';

export function useCall(currentUserId: string) {
  const { socket } = useSocket(currentUserId);
  const { user } = useAuthStore();
  
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [status, setStatus] = useState<SimpleCallStatus>('idle');
  const [callError, setCallError] = useState<string | null>(null);

  // Transition log helper
  const transitionTo = useCallback((nextStatus: SimpleCallStatus, reason?: string) => {
    console.log(`[useCall Log] Transitioning status: ${status} -> ${nextStatus} ${reason ? `(${reason})` : ''}`);
    setStatus(nextStatus);
  }, [status]);

  useEffect(() => {
    if (!socket) {
      console.warn('[useCall Log] Socket not connected yet.');
      return;
    }

    console.log('[useCall Log] Registering call socket event listeners...');

    const handleIncomingCall = (data: any) => {
      console.log('[useCall Log] Received call:incoming event:', data);
      setIncomingCall(data);
      setCallError(null);
      transitionTo('ringing', 'Incoming call from ' + data.callerName);
    };

    const handleCallAccepted = (data: any) => {
      console.log('[useCall Log] Received call:accepted event:', data);
      setActiveCall(data);
      setIncomingCall(null);
      setCallError(null);
      transitionTo('ongoing', 'Call accepted by remote user');
    };

    const handleCallRejected = (data: any) => {
      console.log('[useCall Log] Received call:rejected event:', data);
      setIncomingCall(null);
      setActiveCall(null);
      setCallError(null);
      transitionTo('ended', 'Call was rejected');
      setTimeout(() => transitionTo('idle'), 2000);
    };

    const handleCallEnded = (data: any) => {
      console.log('[useCall Log] Received call:ended event:', data);
      setActiveCall(null);
      setIncomingCall(null);
      setCallError(null);
      transitionTo('ended', 'Call was ended by remote user');
      setTimeout(() => transitionTo('idle'), 2000);
    };

    const handleCallError = (data: any) => {
      console.error('[useCall Log] Received call:error event:', data);
      setIncomingCall(null);
      setActiveCall(null);
      setCallError(data.message || 'Call failed');
      transitionTo('failed', `Error: ${data.message}`);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:error', handleCallError);

    return () => {
      console.log('[useCall Log] Removing call socket event listeners...');
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:error', handleCallError);
    };
  }, [socket, transitionTo]);

  const startCall = useCallback(async (participant: any, type: 'voice' | 'video') => {
    if (!participant) {
      console.error('[useCall Log] startCall failed: Participant is null');
      return;
    }
    if (!socket) {
      console.error('[useCall Log] startCall failed: Socket is not connected');
      setCallError('Socket connection not ready');
      transitionTo('failed', 'No socket connection');
      return;
    }
    
    const recipientId = participant._id || participant.id;
    const recipientName = participant.username || participant.name || 'User';
    console.log(`[useCall Log] Starting ${type} call to ${recipientName} (${recipientId})...`);
    setCallError(null);
    transitionTo('ringing', 'Dialing recipient...');

    try {
      const response = await fetch('http://localhost:3333/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kaeapp_token')}`,
        },
        body: JSON.stringify({ recipientId, type }),
      });
      const result = await response.json();
      
      if (result.success) {
        const callData = {
          callId: result.data._id,
          recipientId,
          type,
          from: currentUserId,
          callerName: user?.username || 'You',
          callerAvatar: user?.avatar,
        };
        setActiveCall(callData);
        console.log('[useCall Log] Call successfully initiated in database. Emitting call:initiate over socket...');
        socket.emit('call:initiate', callData);
      } else {
        console.error('[useCall Log] API returned failure initiating call:', result.message);
        setCallError(result.message || 'Failed to initiate call');
        transitionTo('failed', 'API initiation failure');
      }
    } catch (err: any) {
      console.error('[useCall Log] Exception during startCall fetch:', err);
      setCallError(err.message || 'Failed to start call');
      transitionTo('failed', 'Fetch request error');
    }
  }, [socket, currentUserId, user, transitionTo]);

  const acceptCall = useCallback(() => {
    if (!incomingCall) {
      console.warn('[useCall Log] acceptCall ignored: No incoming call');
      return;
    }
    if (!socket) {
      console.error('[useCall Log] acceptCall failed: Socket not connected');
      return;
    }
    console.log('[useCall Log] Accepting call:', incomingCall.callId);
    socket.emit('call:accept', { callerId: incomingCall.from, callId: incomingCall.callId });
    setActiveCall(incomingCall);
    setIncomingCall(null);
    setCallError(null);
    transitionTo('ongoing', 'Accepted locally');
  }, [incomingCall, socket, transitionTo]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) {
      console.warn('[useCall Log] rejectCall ignored: No incoming call');
      return;
    }
    if (!socket) {
      console.error('[useCall Log] rejectCall failed: Socket not connected');
      return;
    }
    console.log('[useCall Log] Rejecting call:', incomingCall.callId);
    socket.emit('call:reject', { callerId: incomingCall.from, callId: incomingCall.callId });
    setIncomingCall(null);
    setCallError(null);
    transitionTo('idle', 'Rejected locally');
  }, [incomingCall, socket, transitionTo]);

  const endCall = useCallback(() => {
    if (!activeCall) {
      console.warn('[useCall Log] endCall ignored: No active call');
      return;
    }
    if (!socket) {
      console.error('[useCall Log] endCall failed: Socket not connected');
      return;
    }
    const targetUserId = activeCall.recipientId || activeCall.from;
    console.log(`[useCall Log] Ending call ${activeCall.callId} with ${targetUserId}...`);
    socket.emit('call:end', { to: targetUserId, callId: activeCall.callId });
    setActiveCall(null);
    setIncomingCall(null);
    setCallError(null);
    transitionTo('ended', 'Ended locally');
    setTimeout(() => transitionTo('idle'), 1000);
  }, [activeCall, socket, transitionTo]);

  return {
    incomingCall,
    activeCall,
    status,
    callError,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };
}
