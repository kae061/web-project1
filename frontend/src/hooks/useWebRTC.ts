import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { RTCManager } from '../utils/webrtc';
import { useCallStore, CallType, CallPeer } from '../store/callStore';
import { useMedia } from './useMedia';

const API = 'http://localhost:3333/api';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('kaeapp_token')}`,
});

/**
 * useWebRTC — orchestrates RTCManager, media, store, and socket signaling.
 * Mount ONE instance (via CallManager) for the entire app.
 */
export function useWebRTC(socket: Socket | null, currentUserId: string) {
  const rtcRef = useRef<RTCManager | null>(null);
  const { getMediaStream, stopMediaStream, toggleAudio, toggleVideo } = useMedia();

  /* ── helpers ── */

  const peerIdFromStore = () => {
    const s = useCallStore.getState();
    return s.recipient?.id || s.caller?.id || null;
  };

  const cleanup = useCallback(() => {
    rtcRef.current?.close();
    rtcRef.current = null;
    stopMediaStream();
    useCallStore.getState().resetCall();
  }, [stopMediaStream]);

  const createPC = useCallback((): RTCManager => {
    rtcRef.current?.close();
    const mgr = new RTCManager({
      onIceCandidate: (candidate) => {
        const to = peerIdFromStore();
        const callId = useCallStore.getState().callId;
        if (socket && to && callId) {
          socket.emit('ice-candidate', { to, candidate: candidate.toJSON(), callId });
        }
      },
      onTrack: (stream) => useCallStore.getState().setRemoteStream(stream),
      onConnectionStateChange: (state) => {
        useCallStore.getState().setConnectionState(state);
        if (state === 'connected') useCallStore.getState().setConnected();
        if (state === 'failed') cleanup();
      },
    });
    rtcRef.current = mgr;
    return mgr;
  }, [socket, cleanup]);

  /* ── public actions ── */

  /** Caller: initiate a new call */
  const initiateCall = useCallback(
    async (peer: CallPeer, type: CallType) => {
      if (!socket) return;
      try {
        const res = await fetch(`${API}/calls/initiate`, {
          method: 'POST', headers: authHeader(),
          body: JSON.stringify({ recipientId: peer.id, type }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        const callId = json.data._id;
        useCallStore.getState().setOutgoing(callId, type, peer);

        const userJson = localStorage.getItem('kaeapp_user');
        const me = userJson ? JSON.parse(userJson) : {};
        socket.emit('call-user', {
          callId, recipientId: peer.id, type,
          from: currentUserId, callerName: me.username || 'Unknown', callerAvatar: me.avatar,
        });
      } catch (e) { console.error('[useWebRTC] initiateCall', e); cleanup(); }
    },
    [socket, currentUserId, cleanup],
  );

  /** Callee: accept the incoming call */
  const acceptCall = useCallback(async () => {
    if (!socket) return;
    const { caller, callId } = useCallStore.getState();
    if (!caller || !callId) return;
    try {
      await fetch(`${API}/calls/${callId}/accept`, { method: 'PUT', headers: authHeader() });
      socket.emit('accept-call', { callerId: caller.id, callId });
      useCallStore.getState().setConnecting();
    } catch (e) { console.error('[useWebRTC] acceptCall', e); cleanup(); }
  }, [socket, cleanup]);

  /** Callee: reject the incoming call */
  const rejectCall = useCallback(() => {
    if (!socket) return;
    const { caller, callId } = useCallStore.getState();
    if (!caller || !callId) return;
    socket.emit('reject-call', { callerId: caller.id, callId });
    fetch(`${API}/calls/${callId}/reject`, { method: 'PUT', headers: authHeader() }).catch(() => {});
    cleanup();
  }, [socket, cleanup]);

  /** Either side: end the active call */
  const endCall = useCallback(() => {
    if (!socket) return;
    const { callId } = useCallStore.getState();
    const to = peerIdFromStore();
    if (to && callId) {
      socket.emit('end-call', { to, callId });
      fetch(`${API}/calls/${callId}/end`, { method: 'PUT', headers: authHeader() }).catch(() => {});
    }
    cleanup();
  }, [socket, cleanup]);

  const handleToggleAudio = useCallback(() => {
    const muted = toggleAudio();
    useCallStore.getState().setAudioMuted(muted);
  }, [toggleAudio]);

  const handleToggleVideo = useCallback(() => {
    const off = toggleVideo();
    useCallStore.getState().setVideoOff(off);
  }, [toggleVideo]);

  /* ── socket listeners ── */

  useEffect(() => {
    if (!socket) return;

    /** Someone is calling us */
    const onIncoming = (data: any) => {
      if (useCallStore.getState().status !== 'idle') return; // busy
      useCallStore.getState().setIncoming(data.callId, data.type, {
        id: data.from, name: data.callerName, avatar: data.callerAvatar,
      });
    };

    /** Our outgoing call was accepted — we (caller) create the offer */
    const onAccepted = async (data: any) => {
      const store = useCallStore.getState();
      if (store.callId !== data.callId) return;
      try {
        store.setConnecting();
        const type = store.type!;
        const stream = await getMediaStream(type);
        store.setLocalStream(stream);

        const pc = createPC();
        pc.addLocalStream(stream);
        const offer = await pc.createOffer();
        const to = store.recipient?.id || data.acceptedBy;
        socket.emit('webrtc-offer', { to, offer, callId: data.callId });
      } catch (e) { console.error('[useWebRTC] onAccepted', e); cleanup(); }
    };

    const onRejected = () => cleanup();

    /** Callee receives offer → gets media, creates answer */
    const onOffer = async (data: any) => {
      try {
        const store = useCallStore.getState();
        const type = store.type || 'voice';
        const stream = await getMediaStream(type as CallType);
        store.setLocalStream(stream);

        const pc = createPC();
        pc.addLocalStream(stream);
        const answer = await pc.createAnswer(data.offer);
        socket.emit('webrtc-answer', { to: data.from, answer, callId: data.callId });
      } catch (e) { console.error('[useWebRTC] onOffer', e); cleanup(); }
    };

    /** Caller receives answer */
    const onAnswer = async (data: any) => {
      try {
        await rtcRef.current?.setRemoteAnswer(data.answer);
      } catch (e) { console.error('[useWebRTC] onAnswer', e); }
    };

    /** ICE candidate relay */
    const onIce = async (data: any) => {
      try {
        await rtcRef.current?.addIceCandidate(data.candidate);
      } catch (e) { console.warn('[useWebRTC] addIceCandidate', e); }
    };

    /** Remote side ended */
    const onEnded = () => cleanup();

    /** Call failed */
    const onError = (data: { message: string }) => {
      console.error('[WebRTC] Call error received:', data.message);
      useCallStore.getState().setFailed(data.message);
    };

    socket.on('incoming-call', onIncoming);
    socket.on('accept-call', onAccepted);
    socket.on('reject-call', onRejected);
    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('ice-candidate', onIce);
    socket.on('end-call', onEnded);
    socket.on('call:error', onError);

    return () => {
      socket.off('incoming-call', onIncoming);
      socket.off('accept-call', onAccepted);
      socket.off('reject-call', onRejected);
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('ice-candidate', onIce);
      socket.off('end-call', onEnded);
      socket.off('call:error', onError);
    };
  }, [socket, getMediaStream, createPC, cleanup]);

  /* cleanup on unmount */
  useEffect(() => () => { cleanup(); }, [cleanup]);

  return { initiateCall, acceptCall, rejectCall, endCall, handleToggleAudio, handleToggleVideo };
}
