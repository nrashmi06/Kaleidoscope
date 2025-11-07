"use client";

import React, { useState, useEffect, useCallback, JSX } from "react";
import { getHashtagSuggestionsController } from "@/controllers/hashtagController/getHashtagSuggestionsController";
import { useDebounce } from "@/hooks/useDebounce";

interface BodyInputProps {
  value: string;
  onChange: (value: string) => void;
  accessToken?: string;
}

export default function BodyInput({
  value,
  onChange,
  accessToken,
}: BodyInputProps): JSX.Element {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // ✅ Fetch hashtag suggestions
  useEffect(() => {
    const fetchSuggestions = async (): Promise<void> => {
      if (debouncedSearchTerm.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const hashtags = await getHashtagSuggestionsController(
          debouncedSearchTerm,
          accessToken
        );
        setSuggestions(hashtags);
        setShowSuggestions(hashtags.length > 0);
      } catch (error) {
        console.error("Error fetching hashtag suggestions:", error);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm, accessToken]);

  // ✅ Handle typing in textarea
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursor = e.target.selectionStart;
      setCursorPosition(cursor);

      const textBeforeCursor = newValue.slice(0, cursor);
      const match = textBeforeCursor.match(/#(\w*)$/);

      if (match && match[1]) {
        setSearchTerm(match[1]);
      } else {
        setShowSuggestions(false);
        setSearchTerm("");
      }
    },
    [onChange]
  );

  // ✅ Handle selecting a suggestion
  const handleSelectSuggestion = useCallback(
    (tag: string): void => {
      const textBefore = value.slice(0, cursorPosition);
      const textAfter = value.slice(cursorPosition);
      const match = textBefore.match(/#(\w*)$/);

      if (!match || match.index === undefined) return;

      const newText =
        textBefore.slice(0, match.index) + `#${tag} ` + textAfter;

      onChange(newText);
      setShowSuggestions(false);
    },
    [value, cursorPosition, onChange]
  );

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Floating Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Body <span className="text-white-500">*</span>
      </label>

      <textarea
        value={value}
        onChange={handleChange}
        rows={6}
        placeholder="Write your post content here..."
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-3 px-4 z-50 animate-in fade-in-50 slide-in-from-top-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Suggested Hashtags
          </p>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSelectSuggestion(tag)}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
