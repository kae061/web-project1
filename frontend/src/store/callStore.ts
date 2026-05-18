import { create } from 'zustand';

interface CallState {
  activeCall: any | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStartTime: number | null;
  isCallActive: boolean;
  isIncoming: boolean;
  
  // Actions
  setActiveCall: (call: any, isIncoming?: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setCallStartTime: (time: number | null) => void;
  setIsCallActive: (active: boolean) => void;
  resetCall: () => void;
  initiateCall: (recipientId: string, type: 'voice' | 'video') => Promise<void>;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  localStream: null,
  remoteStream: null,
  callStartTime: null,
  isCallActive: false,
  isIncoming: false,

  setActiveCall: (call, isIncoming = false) => set({ activeCall: call, isIncoming }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setCallStartTime: (time) => set({ callStartTime: time }),
  setIsCallActive: (active) => set({ isCallActive: active }),
  
  resetCall: () => set({
    activeCall: null,
    localStream: null,
    remoteStream: null,
    callStartTime: null,
    isCallActive: false,
    isIncoming: false,
  }),

  initiateCall: async (recipientId, type) => {
    console.log('[callStore] initiateCall action triggered:', { recipientId, type });
    // This is a placeholder for the actual logic that will be implemented
    // The user wants to see logs for now.
  },
}));
