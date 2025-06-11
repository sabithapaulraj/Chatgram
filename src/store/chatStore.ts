import { create } from 'zustand';
import { User, Message, Conversation } from '../types';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Record<string, Message[]>;
  onlineUsers: string[];
  isLoading: boolean;
  error: string | null;
}

interface ChatStore extends ChatState {
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, receiverId: string) => void;
  receiveMessage: (message: Message) => void;
  updateUserStatus: (userId: string, isOnline: boolean) => void;
  fetchConversations: () => void;
  fetchMessages: (conversationId: string) => void;
  createNewConversation: (user: { id: string; username: string; email: string }) => void;
  setUserTyping: (userId: string, conversationId: string) => void;
  clearUserTyping: (userId: string, conversationId: string) => void;
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') => void;
  addMessageReaction: (messageId: string, userId: string, reaction: string) => void;
  addMessage: (message: Message) => void;
}

// Mock data
const mockUsers: User[] = [
  { id: '2', username: 'jane', email: 'jane@example.com', isOnline: true },
  { id: '3', username: 'john', email: 'john@example.com', isOnline: false },
  { id: '4', username: 'sarah', email: 'sarah@example.com', isOnline: true },
];

const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participants: [{ id: '1', username: 'demouser', email: 'demo@example.com' }, mockUsers[0]],
    lastMessage: {
      id: 'msg1',
      senderId: '2',
      receiverId: '1',
      content: 'Hey, how are you?',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read'
    },
    unreadCount: 0
  },
  {
    id: 'conv2',
    participants: [{ id: '1', username: 'demouser', email: 'demo@example.com' }, mockUsers[1]],
    lastMessage: {
      id: 'msg2',
      senderId: '1',
      receiverId: '3',
      content: 'Can you send me the report?',
      timestamp: new Date(Date.now() - 86400000),
      status: 'delivered'
    },
    unreadCount: 0
  },
  {
    id: 'conv3',
    participants: [{ id: '1', username: 'demouser', email: 'demo@example.com' }, mockUsers[2]],
    lastMessage: {
      id: 'msg3',
      senderId: '4',
      receiverId: '1',
      content: 'Meeting at 3 PM tomorrow',
      timestamp: new Date(Date.now() - 172800000),
      status: 'sent'
    },
    unreadCount: 1
  }
];

const mockMessages: Record<string, Message[]> = {
  conv1: [
    {
      id: 'msg1-1',
      senderId: '2',
      receiverId: '1',
      content: 'Hey!',
      timestamp: new Date(Date.now() - 7200000),
      status: 'read'
    },
    {
      id: 'msg1-2',
      senderId: '1',
      receiverId: '2',
      content: 'Hi Jane! How are you?',
      timestamp: new Date(Date.now() - 5400000),
      status: 'read'
    },
    {
      id: 'msg1-3',
      senderId: '2',
      receiverId: '1',
      content: 'I\'m good, thanks! How about you?',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read'
    }
  ],
  conv2: [
    {
      id: 'msg2-1',
      senderId: '3',
      receiverId: '1',
      content: 'Do you have the quarterly report?',
      timestamp: new Date(Date.now() - 172800000),
      status: 'read'
    },
    {
      id: 'msg2-2',
      senderId: '1',
      receiverId: '3',
      content: 'I\'ll check and get back to you',
      timestamp: new Date(Date.now() - 129600000),
      status: 'read'
    },
    {
      id: 'msg2-3',
      senderId: '1',
      receiverId: '3',
      content: 'Can you send me the report?',
      timestamp: new Date(Date.now() - 86400000),
      status: 'delivered'
    }
  ],
  conv3: [
    {
      id: 'msg3-1',
      senderId: '4',
      receiverId: '1',
      content: 'Are you available tomorrow?',
      timestamp: new Date(Date.now() - 259200000),
      status: 'read'
    },
    {
      id: 'msg3-2',
      senderId: '1',
      receiverId: '4',
      content: 'Yes, I should be. What time?',
      timestamp: new Date(Date.now() - 216000000),
      status: 'read'
    },
    {
      id: 'msg3-3',
      senderId: '4',
      receiverId: '1',
      content: 'Meeting at 3 PM tomorrow',
      timestamp: new Date(Date.now() - 172800000),
      status: 'sent'
    }
  ]
};

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  onlineUsers: ['2', '4'],
  isLoading: false,
  error: null,

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      get().fetchMessages(conversation.id);
    }
  },

  sendMessage: (content, receiverId) => {
    const { activeConversation, messages } = get();
    if (!activeConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: '1', // Current user ID
      receiverId,
      content,
      timestamp: new Date(),
      status: 'sent'
    };

    // Update messages for the active conversation
    const updatedMessages = {
      ...messages,
      [activeConversation.id]: [
        ...(messages[activeConversation.id] || []),
        newMessage
      ]
    };

    // Update the last message in the active conversation
    const updatedConversations = get().conversations.map(conv => 
      conv.id === activeConversation.id
        ? { ...conv, lastMessage: newMessage }
        : conv
    );

    set({
      messages: updatedMessages,
      conversations: updatedConversations,
      activeConversation: {
        ...activeConversation,
        lastMessage: newMessage
      }
    });
  },

  addMessage: (message) => {
    const { activeConversation, messages } = get();
    if (!activeConversation) return;

    // Update messages for the active conversation
    const updatedMessages = {
      ...messages,
      [activeConversation.id]: [
        ...(messages[activeConversation.id] || []),
        message
      ]
    };

    // Update the last message in the active conversation
    const updatedConversations = get().conversations.map(conv => 
      conv.id === activeConversation.id
        ? { ...conv, lastMessage: message }
        : conv
    );

    set({
      messages: updatedMessages,
      conversations: updatedConversations,
      activeConversation: {
        ...activeConversation,
        lastMessage: message
      }
    });
  },

  receiveMessage: (message) => {
    const { messages, conversations, activeConversation } = get();
    const conversationId = conversations.find(
      c => c.participants.some(p => p.id === message.senderId)
    )?.id;

    if (!conversationId) return;

    // Update messages for the conversation
    const updatedMessages = {
      ...messages,
      [conversationId]: [
        ...(messages[conversationId] || []),
        message
      ]
    };

    // Update unread count and last message
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId
        ? {
            ...conv,
            lastMessage: message,
            unreadCount: activeConversation?.id === conversationId
              ? 0
              : (conv.unreadCount || 0) + 1
          }
        : conv
    );

    set({
      messages: updatedMessages,
      conversations: updatedConversations
    });
  },
  
  setUserTyping: (userId, conversationId) => {
    const { conversations } = get();
    
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId
        ? { 
            ...conv, 
            isTyping: { 
              userId, 
              timestamp: new Date() 
            } 
          }
        : conv
    );

    set({ conversations: updatedConversations });
    
    // Clear typing indicator after 5 seconds of inactivity
    setTimeout(() => {
      const currentConv = get().conversations.find(c => c.id === conversationId);
      if (currentConv?.isTyping?.userId === userId) {
        get().clearUserTyping(userId, conversationId);
      }
    }, 5000);
  },
  
  clearUserTyping: (userId, conversationId) => {
    const { conversations } = get();
    
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId && conv.isTyping?.userId === userId
        ? { ...conv, isTyping: null }
        : conv
    );

    set({ conversations: updatedConversations });
  },
  
  updateMessageStatus: (messageId, status) => {
    const { messages } = get();
    const updatedMessages = { ...messages };
    
    Object.keys(updatedMessages).forEach(convId => {
      updatedMessages[convId] = updatedMessages[convId].map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      );
    });
    
    set({ messages: updatedMessages });
  },
  
  addMessageReaction: (messageId, userId, reaction) => {
    const { messages } = get();
    const updatedMessages = { ...messages };
    
    Object.keys(updatedMessages).forEach(convId => {
      updatedMessages[convId] = updatedMessages[convId].map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          // Check if user already reacted with this emoji
          const existingReactionIndex = reactions.findIndex(
            r => r.userId === userId && r.type === reaction
          );
          
          if (existingReactionIndex >= 0) {
            // Remove existing reaction
            const updatedReactions = [...reactions];
            updatedReactions.splice(existingReactionIndex, 1);
            return { ...msg, reactions: updatedReactions };
          } else {
            // Add new reaction
            return { 
              ...msg, 
              reactions: [...reactions, { userId, type: reaction }] 
            };
          }
        }
        return msg;
      });
    });
    
    set({ messages: updatedMessages });
  },

  updateUserStatus: (userId, isOnline) => {
    const { onlineUsers } = get();
    
    if (isOnline && !onlineUsers.includes(userId)) {
      set({ onlineUsers: [...onlineUsers, userId] });
    } else if (!isOnline && onlineUsers.includes(userId)) {
      set({ onlineUsers: onlineUsers.filter(id => id !== userId) });
    }
  },

  fetchConversations: () => {
    set({ isLoading: true });
    
    // Simulate API call with mock data
    setTimeout(() => {
      set({
        conversations: mockConversations,
        isLoading: false
      });
    }, 500);
  },

  fetchMessages: (conversationId) => {
    set({ isLoading: true });
    
    // Simulate API call with mock data
    setTimeout(() => {
      set({
        messages: {
          ...get().messages,
          [conversationId]: mockMessages[conversationId] || []
        },
        isLoading: false
      });
    }, 300);
  },
  
  createNewConversation: (user) => {
    const { conversations } = get();
    
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.participants.some(p => p.id === user.id)
    );
    
    if (existingConv) {
      get().setActiveConversation(existingConv);
      return;
    }
    
    // Create new conversation
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants: [
        { id: '1', username: 'demouser', email: 'demo@example.com' },
        user
      ],
      unreadCount: 0
    };
    
    // Update conversations list
    const updatedConversations = [newConversation, ...conversations];
    
    set({ 
      conversations: updatedConversations,
      activeConversation: newConversation
    });
    
    // Set up empty message array for this conversation
    set(state => ({
      messages: {
        ...state.messages,
        [newConversation.id]: []
      }
    }));
  }
}));
