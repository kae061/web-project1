import { create } from 'zustand';
import { Chat, Message, Group, SuperGroup, Topic } from '../types';

export type ActiveGroupContext =
  | { kind: 'group'; group: Group }
  | { kind: 'supergroup'; sg: SuperGroup; topic: Topic }
  | null;

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  selectedUserProfileOpen: boolean;
  editingMessage: Message | null;
  replyingTo: Message | null;
  
  // Group state
  groups: Group[];
  superGroups: SuperGroup[];
  activeGroupContext: ActiveGroupContext;
  
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => void;
  setLoading: (loading: boolean) => void;
  toggleUserProfile: (open?: boolean) => void;
  setEditingMessage: (message: Message | null) => void;
  setReplyingTo: (message: Message | null) => void;
  updateMessage: (message: Message) => void;
  loadChats: () => Promise<void>;
  
  // Group actions
  setGroups: (groups: Group[]) => void;
  setSuperGroups: (superGroups: SuperGroup[]) => void;
  setActiveGroupContext: (context: ActiveGroupContext) => void;
  loadGroups: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  selectedUserProfileOpen: false,
  editingMessage: null,
  replyingTo: null,
  
  groups: [],
  superGroups: [],
  activeGroupContext: null,

  setChats: (chats) => set({ chats }),
  setCurrentChat: (currentChat) => set({ currentChat, messages: [], selectedUserProfileOpen: false, editingMessage: null, replyingTo: null, activeGroupContext: null }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  deleteMessage: (messageId) => set((state) => ({ 
    messages: state.messages.filter(m => m._id !== messageId) 
  })),
  setLoading: (isLoading) => set({ isLoading }),
  toggleUserProfile: (open) => set((state) => ({ 
    selectedUserProfileOpen: open !== undefined ? open : !state.selectedUserProfileOpen 
  })),
  setEditingMessage: (editingMessage) => set({ editingMessage }),
  setReplyingTo: (replyingTo) => set({ replyingTo }),
  updateMessage: (message) => set((state) => ({
    messages: state.messages.map(m => m._id === message._id ? message : m)
  })),
  loadChats: async () => {
    set({ isLoading: true });
    try {
      const { chatService } = await import('../services/chatService');
      const data = await chatService.getChats();
      set({ chats: data });
    } catch (err) {
      console.error('Load chats error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadGroups: async () => {
    try {
      const { groupService } = await import('../services/groupService');
      const [g, sg] = await Promise.all([groupService.getGroups(), groupService.getSuperGroups()]);
      set({ groups: g, superGroups: sg });
    } catch (err) {
      console.error('Load groups error:', err);
    }
  },
  
  setGroups: (groups) => set({ groups }),
  setSuperGroups: (superGroups) => set({ superGroups }),
  setActiveGroupContext: (activeGroupContext) => set({ activeGroupContext, currentChat: null, messages: [] }),
}));
