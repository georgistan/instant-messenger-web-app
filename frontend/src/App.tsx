import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LoginModal } from './components/LoginModal';
import type { Channel, User } from './types';

function App() {
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('messenger_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('messenger_user');
      }
    }

    const fetchChannels = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/channels`);
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
          if (data.length > 0) {
            setActiveChannelId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-parchment-900 to-bone-900 flex items-center justify-center">
        <div className="animate-pulse text-taupe-grey-600 text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 sm:gap-6 h-screen w-full bg-gradient-to-br from-parchment-900 to-bone-900 p-4 sm:p-6 lg:p-8 overflow-hidden text-text-main font-sans selection:bg-primary/20 relative">
      {!user && <LoginModal onLogin={setUser} />}

      <Sidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        user={user}
      />
      {activeChannel ? (
        <ChatWindow channel={activeChannel} user={user} />
      ) : (
        <div className="flex-1 flex items-center justify-center telegram-bg rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-border/40">
          <p className="text-taupe-grey-600">No channels available.</p>
        </div>
      )}
    </div>
  );
}

export default App;
