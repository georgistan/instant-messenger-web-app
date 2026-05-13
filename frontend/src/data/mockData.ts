import type { Channel } from '../types';

export const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'general',
    description: 'Company-wide announcements and work-based matters',
    messages: [
      {
        id: 'm1',
        senderId: 'u1',
        senderName: 'Alice Johnson',
        text: 'Welcome to the new messaging platform everyone! 🎉',
        timestamp: '09:00 AM',
        isOwnMessage: false,
      },
      {
        id: 'm2',
        senderId: 'u2',
        senderName: 'Bob Smith',
        text: 'Looks great! Excited to use it.',
        timestamp: '09:15 AM',
        isOwnMessage: false,
      },
      {
        id: 'm3',
        senderId: 'me',
        senderName: 'You',
        text: 'Glad to be here! The UI is super clean.',
        timestamp: '09:16 AM',
        isOwnMessage: true,
      }
    ]
  },
  {
    id: '2',
    name: 'engineering',
    description: 'Tech talk, code reviews, and deployments',
    messages: [
      {
        id: 'm4',
        senderId: 'u3',
        senderName: 'Charlie Dev',
        text: 'Are we deploying the new API to staging today?',
        timestamp: '10:05 AM',
        isOwnMessage: false,
      },
      {
        id: 'm5',
        senderId: 'me',
        senderName: 'You',
        text: 'Yes, the pipeline is currently running. Should be done in 10 minutes.',
        timestamp: '10:08 AM',
        isOwnMessage: true,
      },
      {
        id: 'm6',
        senderId: 'u3',
        senderName: 'Charlie Dev',
        text: 'Awesome, I will keep an eye on the logs.',
        timestamp: '10:10 AM',
        isOwnMessage: false,
      }
    ]
  },
  {
    id: '3',
    name: 'random',
    description: 'Non-work banter and water cooler conversation',
    messages: [
      {
        id: 'm7',
        senderId: 'u4',
        senderName: 'Diana Prince',
        text: 'Anyone want to grab lunch around 12:30?',
        timestamp: '11:45 AM',
        isOwnMessage: false,
      },
      {
        id: 'm8',
        senderId: 'u2',
        senderName: 'Bob Smith',
        text: 'Count me in! I am craving sushi 🍣',
        timestamp: '11:46 AM',
        isOwnMessage: false,
      }
    ]
  }
];
