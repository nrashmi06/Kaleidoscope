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
  const debouncedIconQuery = useDebounce(iconQuery, 300);

  const filteredIcons = lucideIconNames
    .filter((name) => name.toLowerCase().includes(debouncedIconQuery.toLowerCase()))
    .map((name) => {
      const Icon = getLucideIcon(name);
      return Icon ? { name, component: Icon } : null;
    })
    .filter((icon) => icon !== null) as {
      name: (typeof lucideIconNames)[number];
      component: React.ElementType;
    }[];

  const isExactMatch = lucideIconNames.some(
    (name) => name.toLowerCase() === iconQuery.toLowerCase()
  );

  const shouldShowDropdown = isTouched && iconQuery && !isExactMatch;

  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-sm font-medium">Icon</label>
      <input
        type="text"
        className="p-2 rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        value={iconQuery}
        onChange={(e) => {
          setIsTouched(true);
          setIconQuery(e.target.value);
        }}
        onFocus={() => setIsTouched(true)}
        placeholder="Search icon..."
        required
      />

      {shouldShowDropdown && (
        <div className="absolute z-10 top-full mt-1 w-full border rounded max-h-48 overflow-auto bg-white dark:bg-gray-800 shadow">
          {filteredIcons.length > 0 ? (
            filteredIcons.map(({ name, component: Icon }) => (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  onIconSelect(name);
                  setIsTouched(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                <span>{name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No matching icons</div>
          )}
        </div>
      )}
    </div>
  );
};
