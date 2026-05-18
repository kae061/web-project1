import { fetchAPI } from '../utils/api';
import { Chat, Message, User } from '../types';

export const chatService = {
  getChats: async (): Promise<Chat[]> => {
    const response = await fetchAPI('/chats');
    return response.data;
  },

  getChat: async (chatId: string): Promise<Chat> => {
    const response = await fetchAPI(`/chats/${chatId}`);
    return response.data;
  },

  createChat: async (recipientId: string): Promise<Chat> => {
    const response = await fetchAPI('/chats', 'POST', { recipientId });
    return response.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await fetchAPI(`/users/search?q=${query}`);
    return response.data;
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    const response = await fetchAPI(`/chats/${chatId}/messages`);
    return response.data;
  },

  sendMessage: async (chatId: string, content: string, mediaAttachments?: any[], replyTo?: string): Promise<Message> => {
    const response = await fetchAPI('/chats/messages', 'POST', { chatId, content, mediaAttachments, replyTo });
    return response.data;
  },
  
  deleteMessage: async (messageId: string): Promise<void> => {
    await fetchAPI(`/chats/messages/${messageId}`, 'DELETE');
  },

  deleteForMe: async (messageId: string): Promise<void> => {
    await fetchAPI(`/chats/messages/${messageId}/delete-for-me`, 'PUT');
  },

  clearChat: async (chatId: string): Promise<void> => {
    await fetchAPI(`/chats/${chatId}/clear`, 'PUT');
  },

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await fetchAPI(`/chats/messages/${messageId}`, 'PUT', { content });
    return response.data;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await fetchAPI(`/chats/messages/${messageId}/read`, 'PUT');
  },

  addReaction: async (messageId: string, emoji: string): Promise<Message> => {
    const response = await fetchAPI(`/chats/messages/${messageId}/reactions`, 'POST', { emoji });
    return response.data;
  }
};
