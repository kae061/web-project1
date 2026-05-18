import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import Avatar from '../design/Avatar';
import { User } from '../../types';

interface ChatWindowProps {
  currentUserId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId }) => {
  const { currentChat, messages, setMessages, deleteMessage, setLoading } = useChatStore();
  const { sendMessage } = useSocket(currentUserId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChat) {
      const fetchMessages = async () => {
        setLoading(true);
        try {
          const data = await chatService.getMessages(currentChat._id);
          setMessages(data);
        } catch (error) {
          console.error('[ChatWindow] Error:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [currentChat, setMessages, setLoading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
        <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Select a conversation</h2>
        <p className="text-zinc-500 max-w-xs">Pick a chat from the left to start messaging.</p>
      </div>
    );
  }

  const participant = currentChat.participants.find(
    (p) => (typeof p === 'string' ? p : p.id || p._id) !== currentUserId
  ) as User;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b]/40 overflow-hidden">
      <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-zinc-900/20 backdrop-blur-md">
        <div className="flex items-center">
          <Avatar name={participant?.username || 'U'} src={participant?.avatar} status="online" size="md" />
          <div className="ml-4">
            <h3 className="font-bold text-white text-lg">{participant?.username}</h3>
            <span className="text-[11px] font-black text-green-500 uppercase tracking-widest">Online</span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <p className="text-zinc-500 font-medium">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg._id}
              message={msg}
              isSender={(typeof msg.senderId === 'string' ? msg.senderId : msg.senderId.id || msg.senderId._id) === currentUserId}
              onDelete={(id) => deleteMessage(id)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatWindow;
