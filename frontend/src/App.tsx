import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { mockChannels } from './data/mockData';

function App() {
  const [activeChannelId, setActiveChannelId] = useState<string>(mockChannels[0].id);

  const activeChannel = mockChannels.find(c => c.id === activeChannelId) || mockChannels[0];

  return (
    <div className="flex gap-4 sm:gap-6 h-screen w-full bg-gradient-to-br from-parchment-900 to-bone-900 p-4 sm:p-6 lg:p-8 overflow-hidden text-text-main font-sans selection:bg-primary/20">
      <Sidebar 
        channels={mockChannels} 
        activeChannelId={activeChannelId} 
        onSelectChannel={setActiveChannelId} 
      />
      <ChatWindow channel={activeChannel} />
    </div>
  );
}

export default App;
