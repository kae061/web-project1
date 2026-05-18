import React from 'react';
import { User } from '../../types';
import Avatar from '../design/Avatar';

interface UserSearchDropdownProps {
  users: User[];
  onSelectUser: (userId: string) => void;
  isLoading: boolean;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({ users, onSelectUser, isLoading }) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl z-50 text-center text-zinc-500 text-sm animate-pulse font-medium">
        Searching...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl z-50 text-center text-zinc-500 text-sm font-medium">
        No users found
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
      {users.map((user) => (
        <button
          key={user.id || user._id}
          onClick={() => onSelectUser((user.id || user._id)!)}
          className="w-full flex items-center p-4 hover:bg-white/5 border-b border-white/5 last:border-0 transition-all text-left group"
        >
          <Avatar name={user.username} src={user.avatar} size="sm" status={user.status as any} />
          <div className="ml-3">
            <h4 className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">{user.username}</h4>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{user.status || 'offline'}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default UserSearchDropdown;
