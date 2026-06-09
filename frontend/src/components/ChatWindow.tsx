import React, { useRef, useEffect, useState } from 'react';
import type { Channel, User } from '../types';
import { MessageBubble } from './MessageBubble';
import { Hash, Send, Paperclip, Smile, Search, SearchX, ChevronUp, ChevronDown } from 'lucide-react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import { useSocket } from '../hooks/UseSocket';
import { useMessageSearch } from '../hooks/UseMessageSearch';
import { useFileUpload } from '../hooks/UseFileUpload';

interface ChatWindowProps {
  channel: Channel;
  user: User | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channel, user }) => {
  const [inputValue, setInputValue] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, setMessages, isLoading, socketRef } = useSocket(channel.id, channel.name);
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, matchIndex, matchingMessageIds, handleNextMatch, handlePrevMatch } = useMessageSearch(messages);
  const { pendingFiles, addFiles, removePendingFile, clearPendingFiles } = useFileUpload();

  useEffect(() => {
    if (!searchQuery.trim()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, searchQuery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputValue(prev => prev + emojiData.emoji);
    setIsEmojiOpen(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${localStorage.getItem('messenger_token')}`,
        },
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleSendMessage = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!user || !socketRef.current) return;
    if (!inputValue.trim() && pendingFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const entry of pendingFiles) {
        const formData = new FormData();
        formData.append('file', entry.file);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${localStorage.getItem('messenger_token')}`,
          },
          body: formData,
        });
        const { fileUrl, fileName, fileType } = await res.json() as { fileUrl: string; fileName: string; fileType: string };
        socketRef.current.emit('send_message', {
          channelId: channel.id,
          senderId: user.id,
          text: '',
          fileUrl,
          fileName,
          fileType,
        });
      }
      clearPendingFiles();

      if (inputValue.trim()) {
        socketRef.current.emit('send_message', {
          channelId: channel.id,
          senderId: user.id,
          text: inputValue.trim(),
        });
        setInputValue('');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative telegram-bg rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-border/40 overflow-hidden">
      <div className="absolute top-6 left-6 right-6 z-10 flex flex-col items-center gap-3 pointer-events-none">
        <div className="bg-surface/90 backdrop-blur-md shadow-sm border border-border/50 px-6 py-3 rounded-full flex items-center gap-3 pointer-events-auto">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <Hash size={18} className="text-primary" />
          </div>
          <h2 className="text-base font-bold text-text-main">{channel.name}</h2>
          {channel.description && (
            <>
              <div className="w-1 h-1 rounded-full bg-border mx-1" />
              <span className="text-xs text-text-muted font-medium truncate max-w-[300px]">{channel.description}</span>
            </>
          )}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => { setIsSearchOpen(o => !o); setSearchQuery(''); }}
            className="p-1.5 rounded-full hover:bg-surface-active transition-colors text-text-muted hover:text-primary"
          >
            {isSearchOpen ? <SearchX size={16} /> : <Search size={16} />}
          </button>
        </div>

        {isSearchOpen && (
          <div className="pointer-events-auto relative max-w-xs w-full flex items-center bg-surface/90 backdrop-blur-md border border-border/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 rounded-full shadow-sm transition-all overflow-hidden group">
            <Search className="ml-4 text-text-muted w-4 h-4 group-focus-within:text-primary transition-colors shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent py-2 pl-3 pr-2 text-sm text-text-main placeholder-text-muted outline-none"
            />
            {searchQuery && (
              <div className="flex items-center gap-1 pr-3 shrink-0">
                <span className="text-xs text-text-muted mr-1 font-medium">
                  {matchingMessageIds.length > 0 ? `${matchIndex + 1}/${matchingMessageIds.length}` : '0/0'}
                </span>
                <button onClick={handlePrevMatch} className="p-1 text-text-muted hover:text-text-main hover:bg-surface-active rounded transition-colors" disabled={matchingMessageIds.length === 0}>
                  <ChevronUp size={14} />
                </button>
                <button onClick={handleNextMatch} className="p-1 text-text-muted hover:text-text-main hover:bg-surface-active rounded transition-colors" disabled={matchingMessageIds.length === 0}>
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-6 ${isSearchOpen ? 'pt-36' : 'pt-24'} pb-32 scroll-smooth transition-all`}>
        <div className="w-full flex flex-col justify-end min-h-full">
          <div className="mb-12 text-center bg-surface/80 backdrop-blur-sm p-8 rounded-[2.5rem] w-fit mx-auto shadow-sm border border-border/30">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-[1.5rem] rotate-3 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Hash size={36} className="text-primary -rotate-3" />
            </div>
            <h3 className="text-2xl font-bold text-text-main mb-2">Welcome to #{channel.name}!</h3>
            <p className="text-text-muted font-medium">This is the start of the #{channel.name} channel.</p>
          </div>

          <div className="space-y-4">
            {!isLoading && messages.map((message) => {
              const isOwnMessage = user ? message.senderId === user.id : false;
              const isFocusedMatch = matchingMessageIds[matchIndex] === message.id;
              return (
                <div key={message.id} id={`message-${message.id}`}>
                  <MessageBubble
                    message={{ ...message, isOwnMessage }}
                    searchQuery={searchQuery}
                    isFocusedMatch={isFocusedMatch}
                    onDelete={handleDeleteMessage}
                  />
                </div>
              );
            })}
            {!isLoading && messages.length === 0 && (
              <div className="text-center text-taupe-grey-500 py-4">No messages yet. Start the conversation!</div>
            )}
            {isLoading && (
              <div className="text-center text-taupe-grey-500 py-4">Loading messages...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none flex flex-col gap-2">
        {pendingFiles.length > 0 && (
          <div className="pointer-events-auto flex gap-2 flex-wrap bg-surface/95 backdrop-blur-md border border-border/60 rounded-3xl px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {pendingFiles.map((entry, i) => (
              <div key={i} className="relative">
                {entry.previewUrl ? (
                  <img src={entry.previewUrl} className="w-20 h-20 object-cover rounded-2xl border border-border/40" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border border-border/40 bg-surface flex flex-col items-center justify-center gap-1 px-1">
                    <span className="text-2xl">📎</span>
                    <span className="text-[10px] text-text-muted truncate w-full text-center">{entry.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePendingFile(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="w-full relative group pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-text-muted group-focus-within:text-primary transition-colors z-20">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`hover:text-text-main transition-colors p-2 rounded-full hover:bg-surface-active ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Paperclip size={20} />
            </button>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="w-full bg-surface/95 backdrop-blur-md border border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-full py-4 pl-16 pr-28 text-sm text-text-main placeholder-text-muted transition-all outline-none"
            disabled={!user || isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEmojiOpen(o => !o)}
                className={`p-2 transition-colors rounded-full hover:bg-surface-active ${isEmojiOpen ? 'text-primary' : 'text-text-muted hover:text-text-main'}`}
              >
                <Smile size={20} />
              </button>
              {isEmojiOpen && (
                <div className="absolute bottom-12 right-0 z-50 shadow-xl rounded-2xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!user || (!inputValue.trim() && pendingFiles.length === 0) || isLoading || isUploading}
              className="p-2.5 bg-primary text-surface rounded-full hover:bg-primary-hover shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
