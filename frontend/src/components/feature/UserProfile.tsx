import React, { useState, useEffect, useRef } from 'react';
import { User, Chat } from '../../types';
import Avatar from '../design/Avatar';
import { format } from 'date-fns';
import { chatService } from '../../services/chatService';
import { groupService } from '../../services/groupService';
import { useChatStore } from '../../store/chatStore';
import UserSearchResults from './UserSearchResults';
import CreateGroupModal from './CreateGroupModal';
import ProfileEdit from './ProfileEdit';
import { FiPlus, FiUsers, FiEdit2 } from 'react-icons/fi';

interface UserProfileProps {
  user: User;
  chats: Chat[];
  currentChatId?: string;
  currentUserId: string;
  onSelectChat: (chat: Chat) => void;
  onSearch: (query: string) => void;
  activeTab: 'chats' | 'groups' | 'supergroups';
  onTabChange: (tab: 'chats' | 'groups' | 'supergroups') => void;
  onGroupsRefresh?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  chats,
  currentChatId,
  currentUserId,
  onSelectChat,
  onSearch,
  activeTab,
  onTabChange,
  onGroupsRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateSuperGroup, setShowCreateSuperGroup] = useState(false);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  
  const { 
    setCurrentChat, setChats, 
    groups, superGroups, activeGroupContext, setActiveGroupContext, loadGroups 
  } = useChatStore();
  const searchRef = useRef<HTMLDivElement>(null);

  // Load groups on mount or refresh
  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setShowResults(false);
      onSearch('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        const users = await chatService.searchUsers(search);
        setSearchResults(users);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, onSearch]);

  const handleSelectUser = async (selectedUser: User) => {
    try {
      const newChat = await chatService.createChat((selectedUser.id || selectedUser._id)!);
      const existing = chats.find(c => c._id === newChat._id);
      if (!existing) {
        setChats([newChat, ...chats]);
      }
      setCurrentChat(newChat);
      setSearch('');
      setShowResults(false);
      onTabChange('chats');
    } catch (error) {
      console.error('Create chat error:', error);
    }
  };

  const handleCreateTopic = async (sgId: string) => {
    if (!newTopicName.trim()) return;
    try {
      await groupService.createTopic(sgId, newTopicName);
      setNewTopicName('');
      setShowNewTopicInput(false);
      loadGroups(); // reload to get the new topic populated
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] border-r border-gray-200">
      {/* Current User Header */}
      <div className="p-5 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar name={user.username} src={user.avatar} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">{user.username}</h2>
                <button 
                  onClick={() => setShowProfileEdit(true)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Edit Profile"
                >
                  <FiEdit2 size={12} />
                </button>
              </div>
              <p className="text-xs text-gray-400 font-medium">{user.status || 'Online'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowCreateGroup(true)}
              title="New Group"
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowCreateSuperGroup(true)}
              title="New SuperGroup"
              className="p-1.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search.trim() && setShowResults(true)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white outline-none border border-transparent focus:border-blue-200 transition-all"
          />

          {showResults && (
            <UserSearchResults
              results={searchResults}
              isLoading={isSearching}
              onSelectUser={handleSelectUser}
            />
          )}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-gray-100 bg-white px-2 flex-shrink-0">
        {([
          { key: 'chats', label: '💬 Chats' },
          { key: 'groups', label: '👥 Groups' },
          { key: 'supergroups', label: '🌐 Super' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chat List (only shown in chats tab) */}
      {activeTab === 'chats' && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
          {chats.map((chat) => {
            const p = chat.participants.find(
              (u) => (typeof u === 'string' ? u : u.id || u._id) !== currentUserId
            ) as User;
            const isActive = currentChatId === chat._id;
            const lastMsg = typeof chat.lastMessage === 'string' ? null : chat.lastMessage;

            return (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`w-full flex items-center p-3 rounded-xl transition-all group ${isActive
                    ? 'bg-blue-50 border border-blue-100'
                    : 'hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Avatar name={p?.username || 'U'} src={p?.avatar} status={p?.status as any} size="md" />
                <div className="ml-3 flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`text-[13px] font-bold truncate ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                      {p?.username}
                    </h3>
                    {chat.lastMessageTime && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                        {format(new Date(chat.lastMessageTime), 'hh:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] text-gray-400 truncate pr-2">{lastMsg?.content || 'New chat'}</p>
                    {chat.unreadCount > 0 && (
                      <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Groups List */}
      {activeTab === 'groups' && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <FiUsers className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No groups yet</p>
            </div>
          ) : (
            groups.map(g => {
              const isActive = activeGroupContext?.kind === 'group' && activeGroupContext.group._id === g._id;
              return (
                <button
                  key={g._id}
                  onClick={() => setActiveGroupContext({ kind: 'group', group: g })}
                  className={`w-full flex items-center px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-100 border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 text-left min-w-0">
                    <p className={`text-[13px] font-bold truncate ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>{g.name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{(g.members as any[]).length} members</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* SuperGroups List */}
      {activeTab === 'supergroups' && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
          {superGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <span className="text-3xl mb-2">🌐</span>
              <p className="text-sm text-gray-400">No supergroups yet</p>
            </div>
          ) : (
            superGroups.map(sg => {
              const isActive = activeGroupContext?.kind === 'supergroup' && activeGroupContext.sg._id === sg._id;
              const topics = (sg.topics as any[]) || [];
              
              return (
                <div key={sg._id}>
                  <button
                    onClick={() => {
                      if (topics.length > 0) {
                        setActiveGroupContext({ kind: 'supergroup', sg, topic: topics[0] });
                      } else {
                        setActiveGroupContext({ kind: 'supergroup', sg, topic: null as any });
                      }
                    }}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-50 border border-violet-100' : 'hover:bg-gray-100 border border-transparent'}`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {sg.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 text-left min-w-0">
                      <p className={`text-[13px] font-bold truncate ${isActive ? 'text-violet-600' : 'text-gray-900'}`}>{sg.name}</p>
                      {sg.username && <p className="text-[12px] text-gray-500 truncate">@{sg.username}</p>}
                    </div>
                  </button>

                  {/* Topics sub-list */}
                  {isActive && topics.length > 0 && (
                    <div className="ml-4 border-l-2 border-violet-100 pl-2 mb-2 mt-1">
                      {topics.map(t => {
                        const tActive = activeGroupContext.kind === 'supergroup' && activeGroupContext.topic?._id === t._id;
                        return (
                          <button
                            key={t._id}
                            onClick={() => setActiveGroupContext({ kind: 'supergroup', sg, topic: t })}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tActive ? 'bg-violet-100 text-violet-700 font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
                          >
                            <span className="mr-2">{t.icon || '💬'}</span>
                            <span className="truncate">{t.name}</span>
                          </button>
                        );
                      })}

                      {/* New topic */}
                      {showNewTopicInput ? (
                        <div className="flex items-center px-2 py-1.5 mt-1 space-x-2 bg-white rounded-lg border border-gray-200">
                          <input
                            autoFocus
                            value={newTopicName}
                            onChange={e => setNewTopicName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateTopic(sg._id)}
                            placeholder="Topic name..."
                            className="flex-1 text-xs px-1 py-1 outline-none bg-transparent"
                          />
                          <button onClick={() => handleCreateTopic(sg._id)} className="text-violet-600 font-bold text-[10px] uppercase">Add</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowNewTopicInput(true)}
                          className="w-full flex items-center px-3 py-2 mt-1 text-xs font-medium text-gray-400 hover:text-violet-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FiPlus className="mr-1.5" size={12} /> Add topic
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          currentUserId={currentUserId}
          mode="group"
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => loadGroups()}
        />
      )}
      {showCreateSuperGroup && (
        <CreateGroupModal
          currentUserId={currentUserId}
          mode="supergroup"
          onClose={() => setShowCreateSuperGroup(false)}
          onCreated={() => loadGroups()}
        />
      )}
      {showProfileEdit && (
        <ProfileEdit onClose={() => setShowProfileEdit(false)} />
      )}
    </div>
  );
};

export default UserProfile;


