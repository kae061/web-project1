'use client';

import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useCallStore } from '../../store/callStore';
import IncomingCallModal from './IncomingCallModal';
import CallOutgoing from './CallOutgoing';
import CallInterface from './CallInterface';

interface CallManagerProps {
  currentUserId: string;
}

export const CallManager: React.FC<CallManagerProps> = ({ currentUserId }) => {
  const { socket } = useSocket(currentUserId);
  const { acceptCall, rejectCall, endCall, handleToggleAudio, handleToggleVideo } = useWebRTC(socket, currentUserId);
  const { status, caller, recipient, type } = useCallStore();

  if (status === 'idle') return null;

  if (status === 'incoming' && caller && type) {
    return (
      <IncomingCallModal
        callerName={caller.name}
        callerAvatar={caller.avatar}
        type={type}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    );
  }

  if (status === 'outgoing' && recipient && type) {
    return (
      <CallOutgoing
        recipientName={recipient.name}
        recipientAvatar={recipient.avatar || ''}
        type={type}
        onCancel={endCall}
      />
    );
  }

  if (status === 'connecting' || status === 'connected') {
    return (
      <CallInterface
        onEnd={endCall}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
      />
    );
  }

  return null;
};
