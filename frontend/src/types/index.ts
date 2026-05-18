export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
  bio?: string;
  lastSeen?: string;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

export interface Message {
  _id: string;
  senderId: string | User;
  chatId: string;
  groupId?: string;
  superGroupId?: string;
  topicId?: string;
  content: string;
  mediaAttachments: MediaAttachment[];
  isEdited?: boolean;
  editedAt?: string;
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  replyTo?: string | Message;
  deletedFor?: string[];
  isDeleted?: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  participants: (string | User)[];
  messages: string[] | Message[];
  lastMessage?: string | Message;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  creator: string | User;
  admins: (string | User)[];
  members: (string | User)[];
  lastMessage?: string | Message;
  lastMessageTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  _id: string;
  superGroupId: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string | User;
  lastMessage?: string | Message;
  lastMessageTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuperGroup {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  creator: string | User;
  admins: (string | User)[];
  members: (string | User)[];
  topics: (string | Topic)[];
  isPublic: boolean;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

