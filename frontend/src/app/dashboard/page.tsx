'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../services/chatService';
import UserProfile from '../../components/feature/UserProfile';
import ChatMessages from '../../components/feature/ChatMessages';
import GroupMessages from '../../components/feature/GroupMessages';
import { CallManager } from '../../components/feature/CallManager';
import { User, Chat } from '../../types';
import '../../styles/dashboard.css';

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuthStore();
  const { chats, setChats, currentChat, setCurrentChat, loadChats } = useChatStore();
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'supergroups'>('chats');
  
  if (authLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-xl shadow-primary/20" />
    </div>
  );

  if (!user) return null;

  const handleSearch = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      loadChats();
    }
  }, [loadChats]);

  const currentUserId = (user.id || user._id!);

  return (
    <div className="h-screen w-full flex overflow-hidden text-foreground selection:bg-primary/30">
      {/* Left Sidebar */}
      <aside className={`
        ${(activeTab === 'chats' && currentChat) ? 'hidden lg:flex' : 'flex'} 
        w-full lg:w-[280px] flex-shrink-0 flex-col z-30
      `}>
        <UserProfile
          user={user}
          chats={chats}
          currentChatId={currentChat?._id}
          currentUserId={currentUserId}
          onSelectChat={(chat) => {
            setCurrentChat(chat);
            setActiveTab('chats');
          }}
          onSearch={handleSearch}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'chats') setCurrentChat(null);
          }}
          onGroupsRefresh={() => {
            // GroupMessages component will re-fetch on its own via its key or internal state
          }}
        />
      </aside>

      {/* Main Content Area */}
      <main className={`
        ${(activeTab === 'chats' && currentChat) ? 'flex' : (activeTab !== 'chats' ? 'flex' : 'hidden lg:flex')} 
        flex-1 flex-col z-10 bg-white overflow-hidden
      `}>
        {activeTab === 'chats' ? (
          <ChatMessages currentUserId={currentUserId} />
        ) : (
          <GroupMessages currentUserId={currentUserId} />
        )}
      </main>

      <CallManager currentUserId={currentUserId} />
    </div>
  );
}
