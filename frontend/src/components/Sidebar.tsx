import React from 'react';
import { Hash } from 'lucide-react';
import type { Channel } from '../types';

interface SidebarProps {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ channels, activeChannelId, onSelectChannel }) => {
  return (
    <div className="w-72 bg-parchment-600/50 backdrop-blur-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] border border-border/50 h-full flex flex-col z-10 overflow-hidden">
      <div className="h-24 px-8 flex items-center mt-2">
        <h1 className="text-2xl font-extrabold text-text-main flex items-center gap-3 tracking-tight">
          <span className="bg-primary text-surface p-2.5 rounded-[1rem] shadow-sm rotate-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
          </span>
          ChatApp
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 px-4">
        <div className="px-4 mb-4">
          <h2 className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest">Channels</h2>
        </div>
        <ul className="space-y-1.5">
          {channels.map((channel) => (
            <li key={channel.id}>
              <button
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 text-left ${
                  activeChannelId === channel.id
                    ? 'bg-surface shadow-sm text-primary font-bold scale-[1.02]'
                    : 'text-text-muted hover:bg-surface/50 hover:text-text-main hover:scale-[1.01]'
                }`}
              >
                <div className={`p-1.5 rounded-full ${activeChannelId === channel.id ? 'bg-primary/10' : 'bg-transparent'}`}>
                  <Hash size={18} className={activeChannelId === channel.id ? 'text-primary' : 'opacity-60'} />
                </div>
                <span className="truncate">{channel.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6 mx-4">
        <div className="flex items-center gap-3 p-3 bg-surface/80 backdrop-blur-sm border border-border/50 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-shadow-grey-400 flex items-center justify-center text-surface font-bold text-base shadow-inner">
            Y
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-bold text-text-main leading-tight">You</span>
            <span className="text-xs text-text-muted font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
