import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { socketService } from './services/socketService';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { NewChatModal } from './components/NewChatModal';
import { MessageReaction } from './components/MessageReaction';
import { ImageUpload } from './components/ImageUpload';
import { Image, LogOut, Menu, MessageSquare, Moon, Sun, User, Users } from 'lucide-react';
import './index.css';

const ChatSidebar = () => {
  const { conversations, setActiveConversation, activeConversation, onlineUsers } = useChatStore();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Messages</h2>
        <button 
          onClick={() => setShowNewChatModal(true)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          New Chat
        </button>
      </div>
      
      {showNewChatModal && (
        <NewChatModal 
          isOpen={showNewChatModal} 
          onClose={() => setShowNewChatModal(false)} 
        />
      )}
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conversation => {
          const otherUser = conversation.participants.find(p => p.id !== '1');
          const isOnline = otherUser ? onlineUsers.includes(otherUser.id) : false;
          const isActive = activeConversation?.id === conversation.id;
          
          return (
            <div
              key={conversation.id}
              onClick={() => setActiveConversation(conversation)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="relative mr-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {otherUser?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {otherUser?.username}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                  
                  {conversation.unreadCount ? (
                    <span className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ChatMessages = () => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { activeConversation, messages, sendMessage } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const otherUser = activeConversation?.participants.find(p => p.id !== '1');
  const conversationMessages = activeConversation ? messages[activeConversation.id] || [] : [];
  const isTyping = activeConversation?.isTyping && activeConversation.isTyping.userId === otherUser?.id;
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeConversation || !otherUser) return;
    
    if (selectedImage) {
      // Send image message
      socketService.sendImageMessage(otherUser.id, selectedImage);
      setSelectedImage(null);
    } else if (newMessage.trim()) {
      // Send text message
      sendMessage(newMessage, otherUser.id);
      setNewMessage('');
    }
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!activeConversation) return;
    
    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socketService.sendTypingIndicator(activeConversation.id);
    
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  };
  
  const handleReaction = (messageId: string, reaction: string) => {
    socketService.sendMessageReaction(messageId, reaction);
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);
  
  if (!activeConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mr-3">
            <span className="text-base font-medium text-gray-600 dark:text-gray-300">
              {otherUser?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {otherUser?.username}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isTyping ? (
                <span className="text-green-500">Typing...</span>
              ) : (
                useChatStore.getState().onlineUsers.includes(otherUser?.id || '') 
                  ? 'Online' 
                  : 'Offline'
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversationMessages.map(message => {
          const isSelf = message.senderId === '1';
          
          return (
            <div
              key={message.id}
              className={`flex ${isSelf ? 'justify-end' : 'justify-start'} group`}
            >
              <div className="flex flex-col items-center">
                {!isSelf && (
                  <MessageReaction 
                    messageId={message.id} 
                    onAddReaction={handleReaction}
                    existingReactions={message.reactions?.map(r => ({ type: r.type, count: 1 }))}
                  />
                )}
              
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    isSelf
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1 text-xs">
                    {!isSelf && <span className="font-medium">{
                      activeConversation?.participants.find(p => p.id === message.senderId)?.username || 'User'
                    }</span>}
                  </div>
                  
                  {message.imageUrl ? (
                    <div className="mb-1">
                      <img 
                        src={message.imageUrl} 
                        alt="Shared image" 
                        className="max-h-48 rounded-md object-contain" 
                      />
                    </div>
                  ) : null}
                  
                  <p>{message.content}</p>
                  
                  <div className={`text-xs mt-1 flex justify-end items-center ${
                    isSelf ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isSelf && (
                      <span className="ml-1 text-xs flex items-center">
                        • {message.status === 'read' ? (
                            <span className="text-blue-200">Read</span>
                          ) : message.status === 'delivered' ? (
                            <span>Delivered</span>
                          ) : (
                            <span>Sent</span>
                          )}
                      </span>
                    )}
                  </div>
                </div>
                
                {isSelf && (
                  <MessageReaction 
                    messageId={message.id} 
                    onAddReaction={handleReaction}
                    existingReactions={message.reactions?.map(r => ({ type: r.type, count: 1 }))}
                  />
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
        {selectedImage && (
          <div className="mb-2">
            <ImageUpload
              selectedImage={selectedImage}
              onImageSelected={setSelectedImage}
              onClear={() => setSelectedImage(null)}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {!selectedImage && (
            <ImageUpload
              selectedImage={selectedImage}
              onImageSelected={setSelectedImage}
              onClear={() => setSelectedImage(null)}
            />
          )}
          
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() && !selectedImage}
            className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

const Chat = () => {
  const { fetchConversations } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  return (
    <div className="h-full flex">
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 h-full hidden md:block overflow-hidden`}>
        <ChatSidebar />
      </div>
      
      <div className={`${sidebarOpen ? 'hidden' : 'block'} absolute top-4 left-4 z-10 md:hidden`}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md"
        >
          <Menu size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ChatMessages />
      </div>
      
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <div 
          className={`w-80 h-full transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <ChatSidebar />
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ isLogin = true }: { isLogin?: boolean }) => {
  const [mode, setMode] = useState(isLogin);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chatgram</h1>
        <p className="text-gray-600 dark:text-gray-400">Connect with friends securely</p>
      </div>
      
      {mode ? <LoginForm /> : <RegisterForm />}
      
      <p className="mt-6 text-gray-600 dark:text-gray-400 text-sm">
        {mode ? "Don't have an account?" : "Already have an account?"}
        <button
          onClick={() => setMode(!mode)}
          className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
        >
          {mode ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
};

function App() {
  const { isAuthenticated, user, token, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  useEffect(() => {
    if (isAuthenticated && user && token) {
      socketService.connect(token, user.id);
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user, token]);
  
  return (
    <Router>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {isAuthenticated && (
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chatgram</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  
                  <button
                    onClick={logout}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}
        
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <AuthPage isLogin={true} /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <AuthPage isLogin={false} /> : <Navigate to="/" />} />
            <Route path="/" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
