import { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Message } from '../types';

export function useSocket(channelId: string, channelName: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setMessages([]);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/channels/${channelName}/messages`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (res.ok) {
          const data = await res.json() as Message[];
          if (mounted) setMessages(data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchMessages();

    const socket = io(import.meta.env.VITE_API_URL, {
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      auth: { token: localStorage.getItem('messenger_token') ?? '' },
    });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join_channel', channelId));
    socket.on('receive_message', (msg: Message) => {
      if (mounted) setMessages(prev => [...prev, msg]);
    });
    socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
      if (mounted) setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [channelId, channelName]);

  return { messages, setMessages, isLoading, socketRef };
}
