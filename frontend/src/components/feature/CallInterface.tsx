import React, { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../store/callStore';
import Avatar from '../design/Avatar';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';

interface CallInterfaceProps {
  onEnd: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const CallInterface: React.FC<CallInterfaceProps> = ({ onEnd, onToggleAudio, onToggleVideo }) => {
  const store = useCallStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  const peer = store.status === 'incoming' ? store.caller : store.recipient;
  const isConnected = store.status === 'connected';

  // Attach streams
  useEffect(() => {
    if (localVideoRef.current && store.localStream) {
      localVideoRef.current.srcObject = store.localStream;
    }
  }, [store.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && store.remoteStream) {
      remoteVideoRef.current.srcObject = store.remoteStream;
    }
  }, [store.remoteStream]);

  // Timer timer
  useEffect(() => {
    if (!isConnected || !store.callStartTime) return;
    const interval = setInterval(() => {
      setDuration(Date.now() - store.callStartTime!);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, store.callStartTime]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white animate-in fade-in duration-300">
      {/* Header info */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        <h2 className="text-xl font-bold tracking-wide">{peer?.name || 'Unknown'}</h2>
        <p className="text-sm font-medium text-zinc-400 mt-1">
          {isConnected ? formatTime(duration) : store.status === 'connecting' ? 'Connecting...' : 'Calling...'}
        </p>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        {store.type === 'video' ? (
          <>
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              {store.remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center opacity-50">
                  <Avatar src={peer?.avatar} name={peer?.name || 'U'} size="xl" className="w-32 h-32 mb-6" />
                  <p>Waiting for video...</p>
                </div>
              )}
            </div>

            {/* Local Video (PiP) */}
            <div className="absolute bottom-32 right-8 w-48 aspect-[3/4] bg-zinc-800 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl z-20">
              {store.localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${store.isVideoOff ? 'hidden' : ''}`}
                />
              ) : null}
              {store.isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-500">
                  <FiVideoOff size={32} />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Voice Call UI */
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              {isConnected && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 blur-xl" />}
              <Avatar src={peer?.avatar} name={peer?.name || 'U'} size="xl" className="relative w-48 h-48 border-4 border-zinc-800 shadow-2xl" />
            </div>
            {/* Hidden audio elements to actually play the sound */}
            <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
            <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="h-28 bg-gradient-to-t from-zinc-950 to-transparent flex items-end justify-center pb-8 gap-6 z-10">
        <button
          onClick={onToggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            store.isAudioMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          {store.isAudioMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>

        {store.type === 'video' && (
          <button
            onClick={onToggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              store.isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            {store.isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
          </button>
        )}

        <button
          onClick={onEnd}
          className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/20 transition-transform active:scale-90"
        >
          <FiPhoneOff size={28} />
        </button>
      </div>
    </div>
  );
};

export default CallInterface;
