import React, { useState } from 'react';
import type { User } from '../types';

interface LoginModalProps {
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('All fields are required');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      const { token, ...user } = data;
      localStorage.setItem('messenger_user', JSON.stringify(user));
      localStorage.setItem('messenger_token', token);
      onLogin(user);
    } catch {
      setError('Could not connect to server');
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-gunmetal-100/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bone-800 rounded-[2.5rem] p-8 sm:p-10 w-full max-w-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-border/40">
        <h2 className="text-3xl font-bold mb-2 text-center text-parchment-100">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-center text-taupe-grey-500 mb-8">
          {mode === 'login' ? 'Sign in to continue' : 'Join the conversation'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full bg-surface border border-border/50 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-parchment-200 transition-all text-parchment-100"
            disabled={isLoading}
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-surface border border-border/50 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-parchment-200 transition-all text-parchment-100"
            disabled={isLoading}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
          {mode === 'register' && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full bg-surface border border-border/50 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-parchment-200 transition-all text-parchment-100"
              disabled={isLoading}
              autoComplete="new-password"
            />
          )}

          {error && <p className="text-red-500 text-sm ml-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-parchment-200 hover:bg-parchment-100 text-bone-800 font-bold rounded-full py-4 transition-all shadow-md mt-2 disabled:opacity-70"
          >
            {isLoading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-taupe-grey-500 text-sm mt-6">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button onClick={switchMode} className="text-parchment-200 font-semibold hover:underline">
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};
