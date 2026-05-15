import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Copy, Trash2, Check } from 'lucide-react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  searchQuery?: string;
  isFocusedMatch?: boolean;
  onDelete?: (messageId: string) => void;
}

const isEmojiOnly = (text: string) => {
  const stripped = text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[‍️⃣]/gu, '')
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    .trim();
  return stripped.length === 0 && text.trim().length > 0;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, searchQuery, isFocusedMatch, onDelete }) => {
  const { isOwnMessage, senderName, text, timestamp } = message;
  const emojiOnly = isEmojiOnly(text);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => { setCopied(false); setIsMenuOpen(false); }, 1000);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete?.(message.id);
  };

  const renderText = () => {
    if (!searchQuery?.trim()) return text;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className={`${isFocusedMatch ? 'bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-500/50' : 'bg-primary/40 text-gunmetal-100'} rounded-[2px] px-0.5 font-medium transition-colors`}>{part}</mark>
          ) : part
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

      <div className={`flex items-end gap-1.5 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {emojiOnly ? (
          <p className="text-5xl leading-tight px-2 select-none">{text}</p>
        ) : (
          <div
            className={`max-w-[65%] shadow-sm relative transition-all duration-200 hover:shadow-md overflow-hidden ${
              isOwnMessage
                ? 'bg-bone text-gunmetal-100 rounded-[2rem] rounded-br-md'
                : 'bg-surface border border-bone-600 text-gunmetal-100 rounded-[2rem] rounded-bl-md'
            }`}
          >
            {message.fileType === 'image' && message.fileUrl && (
              <img
                src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`}
                alt={message.fileName ?? 'image'}
                className="max-w-full max-h-64 object-cover w-full"
              />
            )}
            {message.fileType === 'file' && message.fileUrl && (
              <a
                href={`${import.meta.env.VITE_API_URL}${message.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl">📎</span>
                <span className="text-sm font-medium underline truncate max-w-[200px]">{message.fileName}</span>
              </a>
            )}
            {text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-4 py-2.5">{renderText()}</p>}
          </div>
        )}

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(o => !o)}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-full text-text-muted hover:text-text-main hover:bg-surface-active transition-all duration-200"
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div className={`absolute bottom-full mb-1 z-[999] bg-surface border border-border/60 rounded-2xl shadow-xl overflow-hidden min-w-[140px] py-1 ${isOwnMessage ? 'right-0' : 'left-0'}`}>
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-main hover:bg-surface-active transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-text-muted" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {isOwnMessage && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
