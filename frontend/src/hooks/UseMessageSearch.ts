import { useState, useEffect } from 'react';
import type { Message } from '../types';

export function useMessageSearch(messages: Message[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [matchIndex, setMatchIndex] = useState(-1);
  const [matchingMessageIds, setMatchingMessageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingMessageIds([]);
      setMatchIndex(-1);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matches = messages
      .filter(m => m.text.toLowerCase().includes(query))
      .map(m => m.id);
    setMatchingMessageIds(matches);
    setMatchIndex(matches.length > 0 ? matches.length - 1 : -1);
  }, [searchQuery, messages]);

  useEffect(() => {
    if (matchIndex >= 0 && matchIndex < matchingMessageIds.length) {
      const el = document.getElementById(`message-${matchingMessageIds[matchIndex]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchIndex, matchingMessageIds]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setMatchIndex(prev => (prev < matchingMessageIds.length - 1 ? prev + 1 : 0));
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setMatchIndex(prev => (prev > 0 ? prev - 1 : matchingMessageIds.length - 1));
  };

  return {
    searchQuery, setSearchQuery,
    isSearchOpen, setIsSearchOpen,
    matchIndex, matchingMessageIds,
    handleNextMatch, handlePrevMatch,
  };
}
