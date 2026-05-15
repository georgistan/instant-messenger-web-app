import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  searchQuery?: string;
  isFocusedMatch?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, searchQuery, isFocusedMatch }) => {
  const { isOwnMessage, senderName, text, timestamp } = message;

  const renderText = () => {
    if (!searchQuery?.trim()) return text;
    
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className={`${isFocusedMatch ? 'bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-500/50' : 'bg-primary/40 text-gunmetal-100'} rounded-[2px] px-0.5 font-medium transition-colors`}>{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className={`flex flex-col w-full ${isOwnMessage ? 'items-end' : 'items-start'} mb-2 group`}>
      <div className={`flex items-baseline gap-2 mb-1.5 px-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-xs font-bold text-text-main/80">{senderName}</span>
        <span className="text-[10px] font-medium text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {timestamp}
        </span>
      </div>
      
      <div 
        className={`max-w-[65%] px-4 py-2.5 shadow-sm relative transition-all duration-200 hover:shadow-md ${
          isOwnMessage 
            ? 'bg-bone text-gunmetal-100 rounded-[2rem] rounded-br-md' 
            : 'bg-surface border border-bone-600 text-gunmetal-100 rounded-[2rem] rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap word-break-words break-words">{renderText()}</p>
      </div>
    </div>
  );
};
