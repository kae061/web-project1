import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { Message } from '../types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3333';

// Global singleton to prevent disconnects on component unmounts
let globalSocket: Socket | null = null;

export const useSocket = (userId?: string) => {
  // 1. useState / useStore hooks
  const { addMessage, updateMessage, deleteMessage, currentChat, messages } = useChatStore();
  const { getToken } = useAuthStore();
  
  // 2. useCallback
  const sendMessage = useCallback((chatId: string, content: string, recipientId: string) => {
    if (globalSocket) {
      globalSocket.emit('message:send', { chatId, content, recipientId });
    }
  }, []);

  const emitTyping = useCallback((chatId: string, recipientId: string) => {
    if (globalSocket) {
      globalSocket.emit('typing:start', { chatId, recipientId });
    }
  }, []);

  const joinChat = useCallback((chatId: string) => {
    if (globalSocket) {
      globalSocket.emit('chat:join', chatId);
    }
  }, []);

  // 3. useEffect
  useEffect(() => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;

    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      globalSocket.on('connect', () => {
        console.log('CONNECTED TO SOCKET (Global Singleton)');
        globalSocket?.emit('user:online', userId);
        globalSocket?.emit('user:join', userId);
      });

      globalSocket.on('disconnect', () => {
        console.log('DISCONNECTED FROM SOCKET');
      });

      globalSocket.on('user:online', (uid: string) => {
        console.log('User online:', uid);
      });

      globalSocket.on('user:offline', (uid: string) => {
        console.log('User offline:', uid);
      });
    }

    const handleMessageReceive = (message: Message) => {
      if (currentChat && message.chatId === currentChat._id) {
        // Use functional check or getState to avoid stale messages in closure
        // without putting 'messages' in the dependency array
        const currentMessages = useChatStore.getState().messages;
        const exists = currentMessages.some(m => m._id === message._id);
        if (!exists) {
          addMessage(message);
        }
      }
    };

    globalSocket.on('message:receive', handleMessageReceive);

    globalSocket.on('message:update', (updatedMessage: Message) => {
      updateMessage(updatedMessage);
    });

    globalSocket.on('message:delete', (data: { messageId: string }) => {
      deleteMessage(data.messageId);
    });

    globalSocket.on('message:reaction', (data: { messageId: string, reactions: any[] }) => {
      const message = messages.find(m => m._id === data.messageId);
      if (message) {
        updateMessage({ ...message, reactions: data.reactions });
      }
    });

    return () => {
      globalSocket?.off('message:receive', handleMessageReceive);
      globalSocket?.off('message:update');
      globalSocket?.off('message:delete');
      globalSocket?.off('message:reaction');
    };
  }, [userId, getToken, addMessage, updateMessage, deleteMessage, currentChat]);

  return { sendMessage, emitTyping, joinChat, socket: globalSocket };
};
