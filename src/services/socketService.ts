import { io, Socket } from 'socket.io-client';
import { Message } from '../types';
import { useChatStore } from '../store/chatStore';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private notificationSound: HTMLAudioElement | null = null;

  // Initialize socket connection
  connect(token: string, userId: string) {
    this.userId = userId;
    
    // Create notification sound
    this.notificationSound = new Audio('https://mocha-cdn.com/notification.mp3');
    
    // In a real app, this would connect to your actual server
    this.socket = io('http://localhost:5000', {
      auth: {
        token
      }
    });

    this.setupListeners();
    return this.socket;
  }

  // Set up event listeners
  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('message', (message: Message) => {
      // Play notification sound for incoming messages
      if (message.senderId !== this.userId) {
        this.notificationSound?.play().catch(err => console.error('Error playing notification:', err));
      }
      
      useChatStore.getState().receiveMessage(message);
    });

    this.socket.on('user:status', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      useChatStore.getState().updateUserStatus(userId, isOnline);
    });
    
    this.socket.on('typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      useChatStore.getState().setUserTyping(userId, conversationId);
    });
    
    this.socket.on('message:reaction', ({ messageId, userId, reaction }: { messageId: string, userId: string, reaction: string }) => {
      useChatStore.getState().addMessageReaction(messageId, userId, reaction);
    });
  }

  // Send a message
  sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'status'>) {
    if (!this.socket) return;

    const fullMessage: Message = {
      ...message,
      id: `client-${Date.now()}`,
      timestamp: new Date(),
      status: 'sent'
    };

    this.socket.emit('message', fullMessage);
    
    // Simulate message delivery status updates
    setTimeout(() => {
      useChatStore.getState().updateMessageStatus(fullMessage.id, 'delivered');
      
      // Simulate the other user responding (for demo purposes)
      if (Math.random() > 0.3) { // 70% chance of reply
        // Show typing indicator
        this.socket?.emit('typing', { 
          userId: message.receiverId, 
          conversationId: useChatStore.getState().activeConversation?.id 
        });
        
        // Use the typing handler directly
        useChatStore.getState().setUserTyping(
          message.receiverId, 
          useChatStore.getState().activeConversation?.id || ''
        );
        
        setTimeout(() => {
          if (this.socket) {
            // Read receipt
            useChatStore.getState().updateMessageStatus(fullMessage.id, 'read');
            
            // Reply message
            const reply: Message = {
              id: `server-${Date.now()}`,
              senderId: message.receiverId,
              receiverId: message.senderId,
              content: this.generateAutoReply(message.content),
              timestamp: new Date(),
              status: 'sent'
            };
            
            // Clear typing indicator
            useChatStore.getState().clearUserTyping(
              message.receiverId,
              useChatStore.getState().activeConversation?.id || ''
            );
            
            // Emit a fake incoming message event
            this.socket.emit('message', reply);
            
            // Use the onmessage handler directly
            useChatStore.getState().receiveMessage(reply);
          }
        }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds
      }
    }, 800); // Delivery receipt after 800ms
    
    return fullMessage;
  }
  
  // Send typing indicator
  sendTypingIndicator(conversationId: string) {
    if (!this.socket || !this.userId) return;
    
    this.socket.emit('typing', { userId: this.userId, conversationId });
  }
  
  // Send message reaction
  sendMessageReaction(messageId: string, reaction: string) {
    if (!this.socket || !this.userId) return;
    
    this.socket.emit('message:reaction', { messageId, userId: this.userId, reaction });
    
    // Simulate the reaction being added
    useChatStore.getState().addMessageReaction(messageId, this.userId, reaction);
  }
  
  // Send image message
  sendImageMessage(receiverId: string, imageFile: File) {
    if (!this.socket) return;
    
    // In a real app, this would upload the image to a server
    // For this demo, we'll simulate it with a data URL
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = () => {
      const imageUrl = reader.result as string;
      
      const fullMessage: Message = {
        id: `client-img-${Date.now()}`,
        senderId: this.userId || '1',
        receiverId,
        content: 'Sent an image',
        imageUrl,
        timestamp: new Date(),
        status: 'sent'
      };
      
      this.socket?.emit('message', fullMessage);
      useChatStore.getState().addMessage(fullMessage);
      
      // Simulate delivery status
      setTimeout(() => {
        useChatStore.getState().updateMessageStatus(fullMessage.id, 'delivered');
        setTimeout(() => {
          useChatStore.getState().updateMessageStatus(fullMessage.id, 'read');
        }, 2000);
      }, 1000);
    };
  }
  
  // Generate a simple auto-reply based on the message content
  private generateAutoReply(content: string): string {
    const lowercaseContent = content.toLowerCase();
    const responses = [
      "Thanks for your message!",
      "I got your message, thanks!",
      "Thanks for reaching out.",
      "I'll get back to you soon.",
      "Got it, thanks!",
      "I appreciate your message.",
      "Message received!",
      "Thanks for letting me know.",
      "I'll take a look at this.",
      "I'll respond properly later."
    ];
    
    // Add some contextual responses
    if (lowercaseContent.includes('hello') || lowercaseContent.includes('hi')) {
      return "Hello there! How can I help you today?";
    }
    
    if (lowercaseContent.includes('how are you')) {
      return "I'm doing well, thanks for asking! How about you?";
    }
    
    if (lowercaseContent.includes('help') || lowercaseContent.includes('support')) {
      return "I'd be happy to help. What do you need assistance with?";
    }
    
    if (lowercaseContent.includes('thanks') || lowercaseContent.includes('thank you')) {
      return "You're welcome! Let me know if you need anything else.";
    }
    
    if (content.endsWith('?')) {
      return "That's a good question. Let me think about it and get back to you.";
    }
    
    // For other messages, pick a random generic response
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
