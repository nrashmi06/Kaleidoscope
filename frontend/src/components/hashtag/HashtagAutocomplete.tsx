'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {  Hash, TrendingUp, Loader2, X } from 'lucide-react';
import { 
  debouncedHashtagSuggestions,
} from '@/controllers/hashtag/hashtagController';
import { 
  HashtagSuggestion,
  HashtagAutocompleteState 
} from '@/lib/types/hashtag';
import { 
  formatUsageCount 
} from '@/lib/mappers/hashtagMapper';
import { useAccessToken } from '@/hooks/useAccessToken';

interface HashtagAutocompleteProps {
  onSelect: (hashtag: HashtagSuggestion) => void;
  placeholder?: string;
  maxSuggestions?: number;
  className?: string;
  disabled?: boolean;
  clearOnSelect?: boolean;
  showUsageCount?: boolean;
  autoFocus?: boolean;
}

export default function HashtagAutocomplete({
  onSelect,
  placeholder = 'Search hashtags...',
  maxSuggestions = 10,
  className = '',
  disabled = false,
  clearOnSelect = true,
  showUsageCount = true,
  autoFocus = false
}: HashtagAutocompleteProps) {
  // Component state
  const [state, setState] = useState<HashtagAutocompleteState>({
    suggestions: [],
    isLoading: false,
    error: null,
    showDropdown: false,
    selectedIndex: -1
  });
  
  const [inputValue, setInputValue] = useState('');
  const [, setIsFocused] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Cleanup function for debounced requests
  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  const token = useAccessToken();

  // Handle search input changes
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    
    // Reset selection when input changes
    setState(prev => ({
      ...prev,
      selectedIndex: -1,
      showDropdown: false
    }));

    // Cleanup previous request
    cleanup();

    // Don't search for empty values
    if (!value.trim()) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        error: null,
        showDropdown: false
      }));
      return;
    }

    // Start debounced search
    cleanupRef.current = debouncedHashtagSuggestions(
      value.trim(), token,
      (result) => {
        setState(prev => ({
          ...prev,
          suggestions: result.suggestions.slice(0, maxSuggestions),
          isLoading: result.isLoading,
          error: result.error,
          showDropdown: result.suggestions.length > 0,
          selectedIndex: -1
        }));
      },
      300
    );
  }, [maxSuggestions, cleanup]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (inputValue.trim() && state.suggestions.length > 0) {
      setState(prev => ({ ...prev, showDropdown: true }));
    }
  }, [inputValue, state.suggestions.length]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      setState(prev => ({ ...prev, showDropdown: false, selectedIndex: -1 }));
    }, 150);
  }, []);

  // Handle hashtag selection
  const handleSelect = useCallback((hashtag: HashtagSuggestion) => {
    onSelect(hashtag);
    
    if (clearOnSelect) {
      setInputValue('');
      setState(prev => ({
        ...prev,
        suggestions: [],
        showDropdown: false,
        selectedIndex: -1,
        error: null
      }));
    }
    
    inputRef.current?.focus();
  }, [onSelect, clearOnSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!state.showDropdown || state.suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.suggestions.length - 1)
        }));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (state.selectedIndex >= 0 && state.suggestions[state.selectedIndex]) {
          handleSelect(state.suggestions[state.selectedIndex]);
        }
        break;
        
      case 'Escape':
        setState(prev => ({
          ...prev,
          showDropdown: false,
          selectedIndex: -1
        }));
        inputRef.current?.blur();
        break;
    }
  }, [state.showDropdown, state.suggestions, state.selectedIndex, handleSelect]);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    setState(prev => ({
      ...prev,
      suggestions: [],
      showDropdown: false,
      selectedIndex: -1,
      error: null,
      isLoading: false
    }));
    cleanup();
    inputRef.current?.focus();
  }, [cleanup]);

  // Scroll selected item into view
  useEffect(() => {
    if (state.selectedIndex >= 0 && suggestionRefs.current[state.selectedIndex]) {
      suggestionRefs.current[state.selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [state.selectedIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Highlight matching prefix in suggestion
  const highlightPrefix = (name: string, prefix: string) => {
    if (!prefix.trim()) return name;
    
    const regex = new RegExp(`^(${prefix.trim()})`, 'gi');
    const parts = name.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-semibold text-blue-600 dark:text-blue-400">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 
            rounded-lg shadow-sm
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
        />
        
        {/* Loading indicator or clear button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {state.isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : inputValue && (
            <button
              onClick={handleClear}
              type="button"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {state.showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {state.suggestions.map((suggestion, index) => (
            <div
              key={suggestion.hashtagId}
              ref={(el) => { suggestionRefs.current[index] = el; }}
              onClick={() => handleSelect(suggestion)}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0
                hover:bg-gray-50 dark:hover:bg-gray-700
                ${state.selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                transition-colors duration-150
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {highlightPrefix(suggestion.name, inputValue)}
                  </span>
                </div>
                
                {showUsageCount && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>{formatUsageCount(suggestion.usageCount)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* No results message */}
          {!state.isLoading && state.suggestions.length === 0 && inputValue.trim() && (
            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
              No hashtags found for &quot;{inputValue}&quot;
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}
    </div>
  );
}
