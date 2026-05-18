import React from 'react';
import { User } from '../../types';
import Avatar from '../design/Avatar';

interface UserSearchResultsProps {
  results: User[];
  isLoading: boolean;
  onSelectUser: (user: User) => void;
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({ results, isLoading, onSelectUser }) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-3 p-6 bg-background border border-white/10 rounded-3xl shadow-2xl z-[100] text-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-secondary-text text-xs font-bold uppercase tracking-widest">Searching Users...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-3 p-8 bg-background border border-white/10 rounded-3xl shadow-2xl z-[100] text-center">
        <p className="text-secondary-text text-sm font-medium">No users found</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-3 bg-background border border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden max-h-[360px] overflow-y-auto custom-scrollbar">
      <div className="p-3">
        {results.map((user) => (
          <button
            key={user.id || user._id}
            onClick={() => onSelectUser(user)}
            className="w-full flex items-center p-4 hover:bg-card/50 rounded-2xl transition-all group text-left mb-1 last:mb-0"
          >
            <Avatar name={user.username} src={user.avatar} size="md" status={user.status as any} />
            <div className="ml-4">
              <h4 className="font-bold text-white group-hover:text-primary transition-colors">{user.username}</h4>
              <p className="text-xs text-secondary-text">{user.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserSearchResults;
