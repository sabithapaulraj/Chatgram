import React, { useState } from 'react';
import { Heart, Smile, ThumbsUp, X } from 'lucide-react';

interface MessageReactionProps {
  messageId: string;
  onAddReaction: (messageId: string, reaction: string) => void;
  existingReactions?: {type: string, count: number}[];
}

export const MessageReaction: React.FC<MessageReactionProps> = ({ 
  messageId, 
  onAddReaction,
  existingReactions = []
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const reactions = [
    { emoji: '👍', name: 'thumbs_up' },
    { emoji: '❤️', name: 'heart' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😮', name: 'wow' },
    { emoji: '😢', name: 'sad' },
    { emoji: '🙏', name: 'pray' },
  ];
  
  return (
    <div className="relative">
      {existingReactions.length > 0 && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-sm">
          {existingReactions.map((reaction, index) => (
            <div key={index} className="flex items-center">
              <span>{reaction.type}</span>
              {reaction.count > 1 && <span className="ml-1 text-xs text-gray-500">{reaction.count}</span>}
            </div>
          ))}
        </div>
      )}
      
      {showReactionPicker ? (
        <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-1 flex z-10">
          {reactions.map((reaction) => (
            <button
              key={reaction.name}
              onClick={() => {
                onAddReaction(messageId, reaction.emoji);
                setShowReactionPicker(false);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="text-lg">{reaction.emoji}</span>
            </button>
          ))}
          <button
            onClick={() => setShowReactionPicker(false)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowReactionPicker(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Smile size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
};
