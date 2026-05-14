import React, { useState } from 'react';
import type { User } from '../types';

interface LoginModalProps {
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to login');
      }

      const user = await res.json();
      localStorage.setItem('messenger_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError('Could not connect to server');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gunmetal-100/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bone-800 rounded-[2.5rem] p-8 sm:p-10 w-full max-w-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-border/40">
        <h2 className="text-3xl font-bold mb-2 text-center text-parchment-100">Welcome</h2>
        <p className="text-center text-taupe-grey-500 mb-8">Enter your username to join the chat</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-surface border border-border/50 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-parchment-200 transition-all text-parchment-100"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm mt-2 ml-4">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-parchment-200 hover:bg-parchment-100 text-bone-800 font-bold rounded-full py-4 transition-all shadow-md mt-2 disabled:opacity-70"
          >
            {isLoading ? 'Joining...' : 'Join Chat'}
          </button>
        </form>
      </div>
    </div>
  );
};
