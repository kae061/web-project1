import React, { useState, useEffect } from 'react';
import { chatService } from '../../services/chatService';
import { User } from '../../types';
import Avatar from '../design/Avatar';
import Button from '../design/Button';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chat: any) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onChatCreated }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await chatService.searchUsers(query);
        setResults(users);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleCreateChat = async (userId: string) => {
    try {
      const chat = await chatService.createChat(userId);
      onChatCreated(chat);
      onClose();
    } catch (error) {
      console.error('Create chat error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-[32px] shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">New Conversation</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="relative group mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Search by username or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-white/5 rounded-2xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-10 text-center text-zinc-500 text-sm animate-pulse font-medium">Searching for users...</div>
            ) : results.length > 0 ? (
              results.map((user) => (
                <button
                  key={user.id || user._id}
                  onClick={() => handleCreateChat((user.id || user._id)!)}
                  className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left"
                >
                  <Avatar name={user.username} src={user.avatar} size="md" status={user.status as any} />
                  <div className="ml-4">
                    <h4 className="font-bold text-zinc-100">{user.username}</h4>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </button>
              ))
            ) : query.trim() ? (
              <div className="py-10 text-center text-zinc-500 text-sm font-medium">No users found for "{query}"</div>
            ) : (
              <div className="py-10 text-center text-zinc-600 text-sm font-medium italic">Start typing to find someone...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
