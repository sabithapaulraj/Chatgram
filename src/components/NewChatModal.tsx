import React, { useState } from 'react';
import { Search, User, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { createNewConversation } = useChatStore();
  
  // Mock users for demonstration
  const mockUsers = [
    { id: '2', username: 'jane', email: 'jane@example.com' },
    { id: '3', username: 'john', email: 'john@example.com' },
    { id: '4', username: 'sarah', email: 'sarah@example.com' },
    { id: '5', username: 'mike', email: 'mike@example.com' },
    { id: '6', username: 'emma', email: 'emma@example.com' },
  ];
  
  const filteredUsers = mockUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelectUser = (user: { id: string; username: string; email: string }) => {
    createNewConversation(user);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">New Conversation</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search users..."
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelectUser(user)}
                    className="w-full px-4 py-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                      <User size={20} className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
