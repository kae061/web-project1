import { create } from 'zustand';

/* ── Types ── */

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected' | 'failed';
export type CallType = 'voice' | 'video';

export interface CallPeer {
  id: string;
  name: string;
  avatar?: string;
}

interface CallState {
  status: CallStatus;
  type: CallType | null;
  callId: string | null;
  caller: CallPeer | null;   // set when incoming
  recipient: CallPeer | null; // set when outgoing
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  callStartTime: number | null;
  connectionState: string | null;
  error: string | null;

  // Actions
  setOutgoing: (callId: string, type: CallType, recipient: CallPeer) => void;
  setIncoming: (callId: string, type: CallType, caller: CallPeer) => void;
  setConnecting: () => void;
  setConnected: () => void;
  setFailed: (msg: string) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  setAudioMuted: (v: boolean) => void;
  setVideoOff: (v: boolean) => void;
  setConnectionState: (v: string | null) => void;
  resetCall: () => void;
}

const INITIAL: Pick<
  CallState,
  | 'status' | 'type' | 'callId' | 'caller' | 'recipient'
  | 'localStream' | 'remoteStream' | 'isAudioMuted' | 'isVideoOff'
  | 'callStartTime' | 'connectionState' | 'error'
> = {
  status: 'idle',
  type: null,
  callId: null,
  caller: null,
  recipient: null,
  localStream: null,
  remoteStream: null,
  isAudioMuted: false,
  isVideoOff: false,
  callStartTime: null,
  connectionState: null,
  error: null,
};

export const useCallStore = create<CallState>((set) => ({
  ...INITIAL,

  setOutgoing: (callId, type, recipient) =>
    set({ status: 'outgoing', type, callId, recipient, caller: null, error: null }),

  setIncoming: (callId, type, caller) =>
    set({ status: 'incoming', type, callId, caller, recipient: null, error: null }),

  setConnecting: () => set({ status: 'connecting', error: null }),

  setConnected: () => set({ status: 'connected', callStartTime: Date.now(), error: null }),

  setFailed: (msg) => {
    const { localStream } = useCallStore.getState();
    localStream?.getTracks().forEach((t) => t.stop());
    set({ ...INITIAL, status: 'failed', error: msg });
  },

  setLocalStream: (s) => set({ localStream: s }),
  setRemoteStream: (s) => set({ remoteStream: s }),
  setAudioMuted: (v) => set({ isAudioMuted: v }),
  setVideoOff: (v) => set({ isVideoOff: v }),
  setConnectionState: (v) => set({ connectionState: v }),

  resetCall: () => {
    const { localStream } = useCallStore.getState();
    localStream?.getTracks().forEach((t) => t.stop());
    set({ ...INITIAL });
  },
}));
