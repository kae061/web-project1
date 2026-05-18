import React from 'react';
import Avatar from '../design/Avatar';

interface ActiveCallScreenProps {
  participantName: string;
  participantAvatar?: string;
  type: 'voice' | 'video';
  onEnd: () => void;
}

const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  participantName,
  participantAvatar,
  type,
  onEnd,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white">
      {/* Participant Info */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="mb-8">
          <Avatar 
            src={participantAvatar} 
            name={participantName} 
            size="xl" 
            className="w-40 h-40 border-4 border-zinc-800"
          />
        </div>
        <h2 className="text-3xl font-bold mb-2">{participantName}</h2>
        <p className="text-zinc-500 font-medium">Ongoing {type} call...</p>
        
        {type === 'video' && (
          <div className="mt-12 w-full max-w-2xl aspect-video bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center text-zinc-600">
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-40 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800/50 flex items-center justify-center gap-8 px-6">
        <button className="w-14 h-14 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {type === 'video' && (
          <button className="w-14 h-14 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        <button 
          onClick={onEnd}
          className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl shadow-red-500/30"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ActiveCallScreen;
