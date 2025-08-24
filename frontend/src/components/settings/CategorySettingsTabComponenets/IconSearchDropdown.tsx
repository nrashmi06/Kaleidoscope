"use client";

import React, { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { lucideIconNames } from "@/lib/constants/validLucideIcons";
import { getLucideIcon } from "@/lib/constants/getLucideIcon";

interface IconSearchDropdownProps {
  iconQuery: string;
  setIconQuery: (value: string) => void;
  onIconSelect: (name: string) => void;
}

export const IconSearchDropdown: React.FC<IconSearchDropdownProps> = ({
  iconQuery,
  setIconQuery,
  onIconSelect,
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const debouncedIconQuery = useDebounce(iconQuery || "", 300);

  const filteredIcons = lucideIconNames
    .filter((name) => {
      // Add null safety for both name and debouncedIconQuery
      if (!name || typeof name !== 'string') return false;
      if (!debouncedIconQuery || typeof debouncedIconQuery !== 'string') return false;
      return name.toLowerCase().includes(debouncedIconQuery.toLowerCase());
    })
    .map((name) => {
      const Icon = getLucideIcon(name);
      return Icon ? { name, component: Icon } : null;
    })
    .filter((icon) => icon !== null) as {
      name: (typeof lucideIconNames)[number];
      component: React.ElementType;
    }[];

  const isExactMatch = lucideIconNames.some(
    (name) => {
      // Add null safety for both name and iconQuery
      if (!name || typeof name !== 'string') return false;
      if (!iconQuery || typeof iconQuery !== 'string') return false;
      return name.toLowerCase() === iconQuery.toLowerCase();
    }
  );

  const shouldShowDropdown = isTouched && iconQuery && !isExactMatch;

  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Icon *</label>
      <input
        type="text"
        className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
        value={iconQuery || ""}
        onChange={(e) => {
          setIsTouched(true);
          setIconQuery(e.target.value || "");
        }}
        onFocus={() => setIsTouched(true)}
        placeholder="Search for an icon..."
        required
      />

      {shouldShowDropdown && (
        <div className="absolute z-20 top-full mt-2 w-full border border-gray-200 dark:border-gray-600 rounded-xl max-h-48 overflow-auto bg-white dark:bg-gray-700 shadow-2xl backdrop-blur-sm">
          {filteredIcons.length > 0 ? (
            filteredIcons.map(({ name, component: Icon }) => (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  onIconSelect(name);
                  setIsTouched(false);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">{name}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No matching icons found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
