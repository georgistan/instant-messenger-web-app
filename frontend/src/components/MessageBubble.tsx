import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { isOwnMessage, senderName, text, timestamp } = message;

  return (
    <div className={`flex flex-col w-full ${isOwnMessage ? 'items-end' : 'items-start'} mb-2 group`}>
      <div className={`flex items-baseline gap-2 mb-1.5 px-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-xs font-bold text-text-main/80">{senderName}</span>
        <span className="text-[10px] font-medium text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {timestamp}
        </span>
      </div>
      
      <div 
        className={`max-w-[75%] px-5 py-3.5 shadow-sm relative transition-all duration-200 hover:shadow-md ${
          isOwnMessage 
            ? 'bg-bone text-gunmetal-100 rounded-[2rem] rounded-br-md' 
            : 'bg-surface border border-bone-600 text-gunmetal-100 rounded-[2rem] rounded-bl-md'
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
};
