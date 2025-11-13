'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hash, Type, Bold, Italic, Link, MessageSquare } from 'lucide-react';
import { fetchHashtagSuggestions } from '@/controllers/hashtag/hashtagController'; 
import { formatUsageCount } from '@/lib/mappers/hashtagMapper';

interface HashtagSuggestion {
  hashtagId: number;
  name: string;
  usageCount: number;
}

interface EnhancedBodyInputProps {
  value: string;
  onChange: (value: string) => void;
  accessToken?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
  disabled?: boolean;
}

export default function EnhancedBodyInput({
  value,
  onChange,
  accessToken = '',
  placeholder = "Write your post content here... Use # to add hashtags",
  minRows = 6,
  className = '',
  disabled = false
}: EnhancedBodyInputProps) {
  // State for hashtag suggestions
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagSearchTerm, setHashtagSearchTerm] = useState('');
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);
  const [hashtagError, setHashtagError] = useState<string | null>(null);

  // Cursor and selection tracking
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Text formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hashtagTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate word and character counts
  useEffect(() => {
    setWordCount(value.trim() ? value.trim().split(/\s+/).length : 0);
    setCharacterCount(value.length);
  }, [value]);

  // Handle textarea change with hashtag detection
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart;

      onChange(newValue);
      setCursorPosition(cursor);
      setSelectionStart(e.target.selectionStart);
      setSelectionEnd(e.target.selectionEnd);

      // Check for hashtag typing
      const textBeforeCursor = newValue.slice(0, cursor);
      const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);

      if (hashtagMatch) {
        const searchTerm = hashtagMatch[1] || '';
        console.log('🏷️ Hashtag detected! Search term:', searchTerm); // Debug log
        setHashtagSearchTerm(searchTerm);

        if (hashtagTimeoutRef.current) {
          clearTimeout(hashtagTimeoutRef.current);
        }

        hashtagTimeoutRef.current = setTimeout(async () => {
          console.log('⏰ Timeout triggered for search term:', searchTerm, 'Token available:', !!accessToken); // Debug log
          if (searchTerm.length >= 0 && accessToken) { // Changed from >= 1 to >= 0 to allow empty search term
            await loadHashtagSuggestions(searchTerm, accessToken);
          } else {
            console.log('❌ Not loading suggestions - term too short or no token'); // Debug log
            setShowHashtagSuggestions(false);
            setHashtagSuggestions([]);
          }
        }, 300);
      } else {
        setShowHashtagSuggestions(false);
        setHashtagSuggestions([]);
        setHashtagSearchTerm('');
        setHashtagError(null);
      }
    },
    [onChange, accessToken]
  );

  // Fetch hashtag suggestions (connected to your controller)
  const loadHashtagSuggestions = useCallback(
    async (searchTerm: string, token: string) => {
      console.log('🚀 loadHashtagSuggestions called with:', { searchTerm, hasToken: !!token }); // Debug log
      
      // Allow empty search term for initial hashtag suggestions
      const isValid = searchTerm.length >= 0; // Change validation to allow empty terms
      if (!isValid) {
        console.log('❌ Invalid search term'); // Debug log
        setHashtagError('Please enter a valid hashtag prefix');
        setShowHashtagSuggestions(false);
        return;
      }

      setIsLoadingHashtags(true);
      setHashtagError(null);

      try {
        console.log('📡 Calling fetchHashtagSuggestions...'); // Debug log
        const result = await fetchHashtagSuggestions(searchTerm || 'a', token, 8); // Use 'a' as fallback for empty search
        console.log('📊 fetchHashtagSuggestions result:', result); // Debug log
        
        if (result.error) {
          console.log('❌ Error in result:', result.error); // Debug log
          setHashtagError(result.error);
          setShowHashtagSuggestions(false);
        } else {
          console.log('✅ Got suggestions:', result.suggestions); // Debug log
          setHashtagSuggestions(result.suggestions);
          setShowHashtagSuggestions(result.suggestions.length > 0);
        }
      } catch (error) {
        console.error('❌ Exception in loadHashtagSuggestions:', error);
        setHashtagError('Failed to load hashtag suggestions');
        setShowHashtagSuggestions(false);
      } finally {
        setIsLoadingHashtags(false);
      }
    },
    []
  );

  // Handle hashtag selection
  const handleHashtagSelect = useCallback(
    (hashtag: HashtagSuggestion) => {
      const textBefore = value.slice(0, cursorPosition);
      const textAfter = value.slice(cursorPosition);
      const hashtagMatch = textBefore.match(/#(\w*)$/);

      if (!hashtagMatch || hashtagMatch.index === undefined) return;

      const newText =
        textBefore.slice(0, hashtagMatch.index) +
        `#${hashtag.name} ` +
        textAfter;

      onChange(newText);
      setShowHashtagSuggestions(false);
      setHashtagSuggestions([]);
      setHashtagSearchTerm('');

      // Refocus textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos =
          (hashtagMatch.index || 0) + hashtag.name.length + 2;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, cursorPosition, onChange]
  );

  // Text formatting
  const wrapSelectedText = useCallback(
    (before: string, after: string = before) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.slice(start, end);

      const newText =
        value.slice(0, start) + before + selectedText + after + value.slice(end);

      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newStart = start + before.length;
        const newEnd = newStart + selectedText.length;
        textarea.setSelectionRange(newStart, newEnd);
      }, 0);
    },
    [value, onChange]
  );

  const handleBold = useCallback(() => {
    wrapSelectedText('**');
    setIsBold((prev) => !prev);
  }, [wrapSelectedText]);

  const handleItalic = useCallback(() => {
    wrapSelectedText('*');
    setIsItalic((prev) => !prev);
  }, [wrapSelectedText]);

  const handleLink = useCallback(() => {
    const selectedText = value.slice(selectionStart, selectionEnd);
    const linkText = selectedText || 'link text';
    wrapSelectedText(`[${linkText}](`, ')');
  }, [value, selectionStart, selectionEnd, wrapSelectedText]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showHashtagSuggestions && hashtagSuggestions.length > 0) {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          handleHashtagSelect(hashtagSuggestions[0]);
          return;
        } else if (e.key === 'Escape') {
          setShowHashtagSuggestions(false);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            handleBold();
            break;
          case 'i':
            e.preventDefault();
            handleItalic();
            break;
          case 'k':
            e.preventDefault();
            handleLink();
            break;
        }
      }
    },
    [showHashtagSuggestions, hashtagSuggestions, handleHashtagSelect, handleBold, handleItalic, handleLink]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (hashtagTimeoutRef.current) {
        clearTimeout(hashtagTimeoutRef.current);
        hashtagTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <Type className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Body Content
          </span>
          <span className="text-red-500">*</span>
        </div>

        {/* Formatting buttons */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleBold}
            className={`p-1.5 rounded-lg transition-colors ${
              isBold
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleItalic}
            className={`p-1.5 rounded-lg transition-colors ${
              isItalic
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleLink}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Link (Ctrl+K)"
          >
            <Link className="h-4 w-4" />
          </button>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Hash className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        </div>
      </div>

      {/* Textarea */}
      <div className="p-4 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full resize-none border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none text-base leading-relaxed"
          style={{ minHeight: `${minRows * 24}px` }}
        />

        {/* Hashtag suggestions */}
        {showHashtagSuggestions && (
          <div className="absolute left-4 right-4 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-2">
              <Hash className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Hashtag Suggestions
              </span>
              {isLoadingHashtags && (
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent" />
              )}
            </div>

            {hashtagError ? (
              <div className="px-3 py-2 text-sm text-red-500 dark:text-red-400">
                {hashtagError}
              </div>
            ) : (
              <div className="py-1">
                {hashtagSuggestions.map((hashtag) => (
                  <button
                    key={hashtag.hashtagId}
                    onClick={() => handleHashtagSelect(hashtag)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Hash className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {hashtag.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {formatUsageCount(hashtag.usageCount)}
                    </span>
                  </button>
                ))}
                {hashtagSuggestions.length === 0 && !isLoadingHashtags && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No hashtags found for &quot;{hashtagSearchTerm}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{wordCount} words</span>
          <span>{characterCount} characters</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-3 w-3" />
          <span>Use # for hashtags • **bold** • *italic*</span>
        </div>
      </div>
    </div>
  );
}
