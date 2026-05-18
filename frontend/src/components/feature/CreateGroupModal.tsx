'use client';

import React, { useState } from 'react';
import { User } from '../../types';
import { groupService } from '../../services/groupService';
import { chatService } from '../../services/chatService';
import Avatar from '../design/Avatar';

interface CreateGroupModalProps {
  currentUserId: string;
  onClose: () => void;
  onCreated: () => void;
  mode?: 'group' | 'supergroup';
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ currentUserId, onClose, onCreated, mode = 'group' }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (q: string) => {
    setMemberSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const users = await chatService.searchUsers(q);
      setSearchResults(users.filter(u => (u.id || u._id) !== currentUserId && !selectedMembers.find(m => (m.id || m._id) === (u.id || u._id))));
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const addMember = (user: User) => {
    setSelectedMembers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter(u => (u.id || u._id) !== (user.id || user._id)));
    setMemberSearch('');
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(u => (u.id || u._id) !== userId));
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setIsCreating(true);
    setError('');
    try {
      const memberIds = selectedMembers.map(m => (m.id || m._id)!);
      if (mode === 'group') {
        await groupService.createGroup(name, description, memberIds);
      } else {
        await groupService.createSuperGroup({ name, description, isPublic, username: username || undefined, memberIds });
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create');
    } finally {
      setIsCreating(false);
    }
  };

  const title = mode === 'group' ? 'Create Group' : 'Create SuperGroup';
  const icon = mode === 'group' ? '👥' : '🌐';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              {mode === 'group' ? 'Group Name' : 'SuperGroup Name'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={mode === 'group' ? 'e.g. Design Team' : 'e.g. Tech Community'}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* SuperGroup-specific fields */}
          {mode === 'supergroup' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Public Username (optional)</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition-all">
                  <span className="px-3 text-gray-400 font-medium text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="my_community"
                    className="flex-1 pr-4 py-2.5 bg-transparent text-sm text-gray-900 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-800">Public Group</p>
                  <p className="text-xs text-gray-500 mt-0.5">Anyone can find and join</p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isPublic ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </>
          )}

          {/* Add Members */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Add Members</label>
            <div className="relative">
              <input
                type="text"
                value={memberSearch}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id || user._id}
                      onClick={() => addMember(user)}
                      className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Avatar name={user.username} src={user.avatar} size="sm" />
                      <div className="ml-3 text-left">
                        <p className="text-sm font-bold text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedMembers.map(m => (
                  <div key={m.id || m._id} className="flex items-center bg-blue-50 border border-blue-100 rounded-full pl-1 pr-2 py-0.5 space-x-1.5">
                    <Avatar name={m.username} src={m.avatar} size="xs" />
                    <span className="text-xs font-bold text-blue-700">{m.username}</span>
                    <button onClick={() => removeMember((m.id || m._id)!)} className="text-blue-400 hover:text-blue-600 ml-0.5">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{icon}</span>
                <span>Create {mode === 'group' ? 'Group' : 'SuperGroup'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
