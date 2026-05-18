'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, Group, SuperGroup, Topic } from '../../types';
import { groupService } from '../../services/groupService';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../design/Avatar';
import { format } from 'date-fns';
import { FiSend, FiHash } from 'react-icons/fi';

interface GroupMessagesProps {
  currentUserId: string;
}

const GroupMessages: React.FC<GroupMessagesProps> = ({ currentUserId }) => {
  const { activeGroupContext } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Re-fetch messages when context changes
  useEffect(() => {
    if (!activeGroupContext) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        if (activeGroupContext.kind === 'group') {
          const msgs = await groupService.getGroupMessages(activeGroupContext.group._id);
          setMessages(msgs);
        } else if (activeGroupContext.kind === 'supergroup' && activeGroupContext.topic) {
          const msgs = await groupService.getTopicMessages(activeGroupContext.sg._id, activeGroupContext.topic._id);
          setMessages(msgs);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Fetch group messages error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [activeGroupContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !activeGroupContext || isSending) return;
    setIsSending(true);
    try {
      let msg: Message;
      if (activeGroupContext.kind === 'group') {
        msg = await groupService.sendGroupMessage(activeGroupContext.group._id, content);
      } else {
        msg = await groupService.sendTopicMessage(activeGroupContext.sg._id, activeGroupContext.topic._id, content);
      }
      setMessages(prev => [...prev, msg]);
      setContent('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (!activeGroupContext || (activeGroupContext.kind === 'supergroup' && !activeGroupContext.topic)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50/50 p-10 h-full">
        <div className="text-5xl mb-4">💬</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Group or Topic</h3>
        <p className="text-gray-400 text-sm">Choose from the list on the left to start chatting</p>
      </div>
    );
  }

  const title = activeGroupContext.kind === 'group'
    ? activeGroupContext.group.name
    : `${activeGroupContext.sg.name} › ${activeGroupContext.topic.name}`;
  
  const subtitle = activeGroupContext.kind === 'group'
    ? `${(activeGroupContext.group.members as any[]).length} members`
    : activeGroupContext.sg.username ? `@${activeGroupContext.sg.username}` : `${(activeGroupContext.sg.members as any[]).length} members`;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-white flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${activeGroupContext.kind === 'group' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-violet-400 to-violet-600'}`}>
            {activeGroupContext.kind === 'group' ? activeGroupContext.group.name.charAt(0).toUpperCase() : activeGroupContext.sg.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-[15px]">{title}</h3>
            <p className="text-[13px] text-gray-500 font-medium">{subtitle}</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <FiHash className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || msg.senderId.id);
            const isSender = String(senderId) === String(currentUserId);
            const senderUser = typeof msg.senderId === 'object' ? msg.senderId : null;
            
            // Check if previous message was from same sender to group them visually
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const prevSenderId = prevMsg ? (typeof prevMsg.senderId === 'string' ? prevMsg.senderId : (prevMsg.senderId._id || prevMsg.senderId.id)) : null;
            const isConsecutive = String(prevSenderId) === String(senderId);

            return (
              <div key={msg._id} className={`flex ${isSender ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                {!isSender && (
                  <div className="w-8 flex-shrink-0 mr-2 flex flex-col justify-end">
                    {!isConsecutive && <Avatar name={senderUser?.username || 'U'} src={senderUser?.avatar} size="sm" />}
                  </div>
                )}
                
                <div className={`max-w-[70%] flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                  {!isSender && !isConsecutive && (
                    <span className="text-[12px] font-bold text-blue-600 mb-1 pl-1">{senderUser?.username}</span>
                  )}
                  
                  <div className={`
                    px-4 py-2.5 text-[14px] shadow-sm relative group/msg
                    ${isSender 
                      ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white ${isConsecutive ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-sm'}` 
                      : `bg-white border border-gray-100 text-gray-900 ${isConsecutive ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-sm'}`
                    }
                  `}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] block text-right mt-1.5 ${isSender ? 'text-blue-100' : 'text-gray-400'}`}>
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 z-10 flex-shrink-0">
        <div className="flex items-end space-x-2 bg-[#f5f5f5] rounded-2xl p-2 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none resize-none px-3 py-2.5 custom-scrollbar"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className={`
              p-2.5 h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
              ${!content.trim() || isSending 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95'
              }
            `}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSend className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMessages;
