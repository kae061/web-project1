import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../services/chatService';
import { User, Chat } from '../../types';
import { format } from 'date-fns';
import Avatar from '../design/Avatar';
import UserSearchDropdown from './UserSearchDropdown';

interface ChatListProps {
  currentUserId: string;
}

const ChatList: React.FC<ChatListProps> = ({ currentUserId }) => {
  const { chats, setChats, currentChat, setCurrentChat, setLoading } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const data = await chatService.getChats();
        setChats(data);
      } catch (err) {
        console.error('[ChatList] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [setChats, setLoading]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const users = await chatService.searchUsers(searchQuery);
        setSearchResults(users);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = async (userId: string) => {
    try {
      const newChat = await chatService.createChat(userId);
      const existing = chats.find(c => c._id === newChat._id);
      if (!existing) {
        setChats([newChat, ...chats]);
      }
      setCurrentChat(newChat);
      setSearchQuery('');
      setShowDropdown(false);
    } catch (error) {
      console.error('Create chat error:', error);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const p = chat.participants.find(
      (u) => (typeof u === 'string' ? u : u.id || u._id) !== currentUserId
    ) as User;
    return p?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-white/5">
      <div className="p-8 pb-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-white">Messages</h1>
          <div className="flex space-x-2">
            <button className="p-2.5 bg-zinc-900 text-zinc-400 rounded-xl hover:text-white transition-all">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="relative group" ref={dropdownRef}>
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/30 outline-none transition-all"
          />

          {showDropdown && (
            <UserSearchDropdown 
              users={searchResults} 
              onSelectUser={handleSelectUser} 
              isLoading={isSearching} 
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1 mt-4 custom-scrollbar">
        {filteredChats.map((chat) => {
          const p = chat.participants.find(
            (u) => (typeof u === 'string' ? u : u.id || u._id) !== currentUserId
          ) as User;
          const isActive = currentChat?._id === chat._id;
          const lastMsg = typeof chat.lastMessage === 'string' ? null : chat.lastMessage;

          return (
            <button
              key={chat._id}
              onClick={() => setCurrentChat(chat)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all group ${
                isActive ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <Avatar name={p?.username || 'U'} src={p?.avatar} status={p?.status as any} size="md" />
              <div className="ml-4 flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-[15px] font-bold truncate ${isActive ? 'text-blue-400' : 'text-zinc-100'}`}>
                    {p?.username}
                  </h3>
                  {chat.lastMessageTime && (
                    <span className="text-[10px] text-zinc-600 font-bold uppercase">
                      {format(new Date(chat.lastMessageTime), 'HH:mm')}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[13px] text-zinc-500 truncate">{lastMsg?.content || 'New chat'}</p>
                  {chat.unreadCount > 0 && (
                    <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
