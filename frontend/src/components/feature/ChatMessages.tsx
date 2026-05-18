import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { chatService } from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import Avatar from '../design/Avatar';
import ProfileModal from './ProfileModal';
import { User, Message } from '../../types';
import { FiPhone, FiVideo, FiSmile } from 'react-icons/fi';

interface ChatMessagesProps {
  currentUserId: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ currentUserId }) => {
  const {
    currentChat,
    messages,
    setMessages,
    deleteMessage,
    setLoading,
    isLoading,
    selectedUserProfileOpen,
    toggleUserProfile,
    setEditingMessage,
    setReplyingTo,
    deleteMessage: storeDeleteMessage,
    updateMessage
  } = useChatStore();
  
  const { user } = useAuthStore();
  const userId = user?.id || user?._id || currentUserId;
  const { sendMessage, socket, joinChat } = useSocket(userId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!socket) return;

    socket.on('message:deleted', (data: { messageId: string }) => {
      // Use getState to avoid dependency on 'messages' array which causes re-subscriptions
      const currentMessages = useChatStore.getState().messages;
      const updated = currentMessages.map(m => 
        m._id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted', mediaAttachments: [] } : m
      );
      setMessages(updated);
    });

    return () => {
      socket.off('message:deleted');
    };
  }, [socket, setMessages]);

  useEffect(() => {
    if (currentChat) {
      console.log('[ChatMessages] Current Chat active:', currentChat?._id, currentChat);
      joinChat(currentChat._id);
      const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await chatService.getMessages(currentChat._id);
          console.log('[ChatMessages] Fetched messages success:', data.length, data);
          setMessages(data);
        } catch (error: any) {
          console.error('[ChatMessages] Fetch Error:', error);
          setError(error.message || 'Failed to load messages. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [currentChat?._id, setMessages, setLoading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in bg-gray-50/50">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Select a conversation</h2>
        <p className="text-[#666666] max-w-xs">Pick a chat from the left to start messaging.</p>
      </div>
    );
  }

  const handleDelete = async (id: string, mode: 'me' | 'everyone') => {
    try {
      if (mode === 'everyone') {
        await chatService.deleteMessage(id);
        // We rely on socket for global delete, but update local state too
        const updated = messages.map(m => 
          m._id === id ? { ...m, isDeleted: true, content: 'This message was deleted', mediaAttachments: [] } : m
        );
        setMessages(updated);
      } else {
        await chatService.deleteForMe(id);
        // Soft delete - hide for me locally
        const updated = messages.map(m => 
          m._id === id ? { ...m, deletedFor: [...(m.deletedFor || []), currentUserId] } : m
        );
        setMessages(updated);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete message');
    }
  };

  const handleClearChat = async () => {
    if (!currentChat) return;
    if (!window.confirm('Clear all messages in this chat for you?')) return;
    
    try {
      await chatService.clearChat(currentChat._id);
      setMessages([]); // Clear locally
    } catch (err: any) {
      console.error('Clear chat error:', err);
      setError(err.message || 'Failed to clear chat');
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
  };

  const handleForward = (message: Message) => {
    // For now just alert, but could open a contact picker
    alert(`Forwarding message: ${message.content}`);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const updated = await chatService.addReaction(messageId, emoji);
      updateMessage(updated);
    } catch (err: any) {
      console.error('Reaction error:', err);
    }
  };

  const handleVoiceCall = async () => {
    if (!participant || !socket) return;
    
    try {
      const response = await fetch('http://localhost:3333/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kaeapp_token')}`,
        },
        body: JSON.stringify({ recipientId: participant._id || participant.id, type: 'voice' }),
      });
      const result = await response.json();
      
      if (result.success) {
        const callId = result.data._id;
        const peer = { id: participant._id || participant.id, name: participant.username, avatar: participant.avatar };
        useCallStore.getState().setOutgoing(callId, 'voice', peer);
        
        socket.emit('call-user', {
          callId,
          recipientId: peer.id,
          type: 'voice',
          from: currentUserId,
          callerName: user?.username || 'You',
          callerAvatar: user?.avatar,
        });
      }
    } catch (err) {
      console.error('Failed to start voice call:', err);
    }
  };

  const handleVideoCall = async () => {
    if (!participant || !socket) return;
    
    try {
      const response = await fetch('http://localhost:3333/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kaeapp_token')}`,
        },
        body: JSON.stringify({ recipientId: participant._id || participant.id, type: 'video' }),
      });
      const result = await response.json();
      
      if (result.success) {
        const callId = result.data._id;
        const peer = { id: participant._id || participant.id, name: participant.username, avatar: participant.avatar };
        useCallStore.getState().setOutgoing(callId, 'video', peer);
        
        socket.emit('call-user', {
          callId,
          recipientId: peer.id,
          type: 'video',
          from: currentUserId,
          callerName: user?.username || 'You',
          callerAvatar: user?.avatar,
        });
      }
    } catch (err) {
      console.error('Failed to start video call:', err);
    }
  };

  const participant = currentChat.participants.find(
    (p) => (typeof p === 'string' ? p : p.id || p._id) !== currentUserId
  ) as User;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white z-20">
        <div className="flex items-center cursor-pointer group" onClick={() => toggleUserProfile(true)}>
          <Avatar name={participant?.username || 'U'} src={participant?.avatar} status="online" size="md" />
          <div className="ml-4">
            <h2 className="text-lg font-medium text-[#000000] tracking-tight flex items-center">
              {participant?.username}
              <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={handleVoiceCall}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
          >
            <FiPhone className="h-5 w-5" />
          </button>
          <button 
            onClick={handleVideoCall}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
          >
            <FiVideo className="h-5 w-5" />
          </button>
          <div className="relative group">
            <button 
              className="p-2 text-gray-400 hover:text-primary transition-colors ml-2 border-l border-gray-100 pl-4"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
              <button 
                onClick={() => toggleUserProfile(true)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
                <FiSmile className="mr-3 text-gray-400" /> View Profile
              </button>
              <button 
                onClick={handleClearChat}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center border-t border-gray-50"
              >
                <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 custom-scrollbar relative"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-[#666666]">Loading conversation...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#666666]">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const msgSenderId = !msg.senderId
                ? ''
                : typeof msg.senderId === 'string'
                  ? msg.senderId
                  : (msg.senderId._id || msg.senderId.id || '');
              const isSender = !!msgSenderId && String(msgSenderId) === String(currentUserId);
              
              const prevMsg = messages[i - 1];
              const prevSenderId = prevMsg
                ? (!prevMsg.senderId
                    ? ''
                    : typeof prevMsg.senderId === 'string'
                      ? prevMsg.senderId
                      : (prevMsg.senderId._id || prevMsg.senderId.id || ''))
                : null;
              const showAvatar = !isSender && (!prevMsg || String(prevSenderId) !== String(msgSenderId));

              return (
                <ChatBubble
                  key={msg._id}
                  message={msg}
                  isSender={isSender}
                  showAvatar={showAvatar}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onForward={handleForward}
                  onReact={handleReact}
                  onReply={setReplyingTo}
                  currentUserId={currentUserId}
                />
              );
            })}
          </div>
        )}
      </div>

      <MessageInput isLoading={isLoading} />

      <ProfileModal
        user={participant}
        isOpen={selectedUserProfileOpen}
        onClose={() => toggleUserProfile(false)}
      />
    </div>
  );
};

export default ChatMessages;
