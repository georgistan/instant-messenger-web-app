import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Channel, Message, User } from '../types';
import { MessageBubble } from './MessageBubble';
import { Hash, Send, Paperclip, Smile } from 'lucide-react';

interface ChatWindowProps {
  channel: Channel;
  user: User | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channel, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/channels/${channel.name}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setMessages(data);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();

    const socket = io('http://localhost:3001', {
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_channel', channel.id);
    });

    socket.on('receive_message', (newMessage: Message) => {
      if (mounted) {
        setMessages(prev => [...prev, newMessage]);
      }
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [channel.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      channelId: channel.id,
      senderId: user.id,
      text: inputValue.trim(),
    });

    setInputValue('');
  };

  return (
    <div className="flex-1 flex flex-col h-full relative telegram-bg rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-border/40 overflow-hidden">
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-center pointer-events-none">
        <div className="bg-surface/90 backdrop-blur-md shadow-sm border border-border/50 px-6 py-3 rounded-full flex items-center gap-3 pointer-events-auto">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <Hash size={18} className="text-primary" />
          </div>
          <h2 className="text-base font-bold text-text-main">{channel.name}</h2>
          {channel.description && (
            <>
              <div className="w-1 h-1 rounded-full bg-border mx-1" />
              <span className="text-xs text-text-muted font-medium">{channel.description}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-28 pb-32 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
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
              return <MessageBubble key={message.id} message={{ ...message, isOwnMessage }} />;
            })}
            {isLoading && (
              <div className="text-center text-taupe-grey-500 py-4">Loading messages...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-text-muted group-focus-within:text-primary transition-colors z-20">
            <button type="button" className="hover:text-text-main transition-colors p-2 rounded-full hover:bg-surface-active"><Paperclip size={20} /></button>
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
            <button type="button" className="p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-surface-active">
              <Smile size={20} />
            </button>
            <button
              type="submit"
              disabled={!user || !inputValue.trim() || isLoading}
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
