export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isOwnMessage: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  messages?: Message[];
}

export interface User {
  id: string;
  username: string;
  avatar?: string | null;
}
