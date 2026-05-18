import React from 'react';

interface CallControlsProps {
  onMicToggle: () => void;
  onCameraToggle?: () => void;
  onHangUp: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled?: boolean;
  type: 'voice' | 'video';
}

const CallControls: React.FC<CallControlsProps> = ({
  onMicToggle,
  onCameraToggle,
  onHangUp,
  isAudioEnabled,
  isVideoEnabled,
  type,
}) => {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-6 px-8 py-4 bg-zinc-800/80 backdrop-blur-md rounded-full shadow-2xl border border-zinc-700/50">
      {/* Mic Toggle */}
      <button 
        onClick={onMicToggle}
        className={`p-4 rounded-full transition-all active:scale-90 ${
          isAudioEnabled ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {isAudioEnabled ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v10a3 3 0 006 0V5a3 3 0 00-3-3z" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )}
      </button>

      {/* Camera Toggle (Video Only) */}
      {type === 'video' && onCameraToggle && (
        <button 
          onClick={onCameraToggle}
          className={`p-4 rounded-full transition-all active:scale-90 ${
            isVideoEnabled ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isVideoEnabled ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>
      )}

      {/* Hang Up */}
      <button 
        onClick={onHangUp}
        className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/20 transition-all active:scale-90 ring-4 ring-red-600/20"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.209.435l-1.45 2.417A12.052 12.052 0 016.962 10.43l2.417-1.45a1 1 0 00.435-1.209L8.314 3.281A1 1 0 007.366 2.6L5 3z" />
        </svg>
      </button>
    </div>
  );
};

export default CallControls;
