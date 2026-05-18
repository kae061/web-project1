import React from 'react';
import Avatar from '../design/Avatar';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string;
  type: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName,
  callerAvatar,
  type,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
          <Avatar 
            src={callerAvatar} 
            name={callerName} 
            size="xl" 
            className="relative border-4 border-zinc-800"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
        <p className="text-zinc-400 font-medium mb-10 flex items-center gap-2">
          {type === 'voice' ? (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          )}
          Incoming {type} call...
        </p>

        <div className="flex gap-6 w-full">
          <button
            onClick={onReject}
            className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={onAccept}
            className="flex-1 h-14 bg-green-500 hover:bg-green-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-green-500/20"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
