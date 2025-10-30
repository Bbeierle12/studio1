'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recipe' | 'ingredient' | 'recent';
}

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

export function EnhancedSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Fetch suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        // Show recent searches when empty
        setSuggestions(
          recentSearches.map((text, index) => ({
            id: `recent-${index}`,
            text,
            type: 'recent' as const,
          }))
        );
        return;
      }

      try {
        const response = await fetch(`/api/recipes/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, recentSearches]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [
      query,
      ...recentSearches.filter(s => s !== query),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    saveRecentSearch(query);
    router.push(`/recipes?search=${encodeURIComponent(query.trim())}`);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSearch(suggestions[selectedIndex].text);
    } else {
      handleSearch(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setSuggestions([]);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'ingredient':
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 max-w-md mx-4 hidden md:block" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg z-50">
            <ScrollArea className="max-h-[300px]">
              <div className="py-2">
                {!searchQuery.trim() && recentSearches.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                    <span>Recent Searches</span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSearch(suggestion.text)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left',
                      selectedIndex === index && 'bg-accent'
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </form>
    </div>
  );
}
