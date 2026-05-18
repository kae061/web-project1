import React from 'react';

interface CallWindowProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  type: 'voice' | 'video';
  participantName: string;
  participantAvatar: string;
}

const CallWindow: React.FC<CallWindowProps> = ({ 
  localStream, 
  remoteStream, 
  type, 
  participantName, 
  participantAvatar 
}) => {
  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden flex items-center justify-center">
      {/* Remote Stream */}
      <div className="w-full h-full">
        {type === 'video' && remoteStream ? (
          <video
            autoPlay
            playsInline
            ref={(video) => { if (video) video.srcObject = remoteStream; }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
            <img 
              src={participantAvatar} 
              alt={participantName} 
              className="w-40 h-40 rounded-full border-4 border-zinc-800 shadow-2xl animate-pulse" 
            />
            <h2 className="text-3xl font-bold text-white">{participantName}</h2>
            {type === 'voice' && (
              <div className="flex space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-1.5 h-6 bg-blue-500 rounded-full animate-bounce delay-${i * 100}`} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local Stream (PIP) */}
      {type === 'video' && localStream && (
        <div className="absolute top-6 right-6 w-40 h-60 bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700/50">
          <video
            autoPlay
            playsInline
            muted
            ref={(video) => { if (video) video.srcObject = localStream; }}
            className="w-full h-full object-cover mirror"
          />
        </div>
      )}
    </div>
  );
};

export default CallWindow;
