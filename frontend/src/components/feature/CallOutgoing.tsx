import React from 'react';

interface CallOutgoingProps {
  recipientName: string;
  recipientAvatar: string;
  type: 'voice' | 'video';
  onCancel: () => void;
}

const CallOutgoing: React.FC<CallOutgoingProps> = ({
  recipientName,
  recipientAvatar,
  type,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600 rounded-full animate-pulse opacity-10 blur-xl" />
          <img 
            src={recipientAvatar || `https://ui-avatars.com/api/?name=${recipientName}`} 
            alt={recipientName} 
            className="w-40 h-40 rounded-full border-4 border-zinc-900 shadow-2xl" 
          />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{recipientName}</h2>
          <p className="text-zinc-500 font-medium tracking-wide">
            CALLING ({type.toUpperCase()})...
          </p>
        </div>

        <div className="flex space-x-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>

        <button 
          onClick={onCancel}
          className="mt-20 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/20 transition-all active:scale-90"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CallOutgoing;
