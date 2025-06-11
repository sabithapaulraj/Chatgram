export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface MessageReaction {
  userId: string;
  type: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  reactions?: MessageReaction[];
  imageUrl?: string;
  isVoice?: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isTyping?: {
    userId: string;
    timestamp: Date;
  } | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
