// src/components/settings/CategorySettingsTabComponenets/IconSearchDropdown.tsx
"use client";

import React, { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { lucideIconNames } from "@/lib/constants/validLucideIcons";
import { getLucideIcon } from "@/lib/constants/getLucideIcon";
import { Search } from "lucide-react";

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
      if (!name || typeof name !== "string") return false;
      if (!debouncedIconQuery || typeof debouncedIconQuery !== "string")
        return false;
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

  const isExactMatch = lucideIconNames.some((name) => {
    if (!name || typeof name !== "string") return false;
    if (!iconQuery || typeof iconQuery !== "string") return false;
    return name.toLowerCase() === iconQuery.toLowerCase();
  });

  const shouldShowDropdown = isTouched && iconQuery && !isExactMatch;

  return (
    <div className="space-y-1.5 relative">
      <label className="text-sm font-semibold text-navy dark:text-cream flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
        Icon *
      </label>
      <input
        type="text"
        className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
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
        <div className="absolute z-20 top-full mt-1.5 w-full rounded-xl max-h-48 overflow-auto bg-cream-50 dark:bg-navy border border-cream-300/50 dark:border-navy-700/60 shadow-xl shadow-navy/10 dark:shadow-black/30">
          {filteredIcons.length > 0 ? (
            filteredIcons.map(({ name, component: Icon }) => (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onIconSelect(name);
                  setIsTouched(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-steel/5 dark:hover:bg-sky/5 cursor-pointer transition-colors border-b border-cream-300/20 dark:border-navy-700/20 last:border-b-0"
              >
                <div className="p-1.5 rounded-lg bg-steel/8 dark:bg-sky/8">
                  <Icon className="w-4 h-4 text-steel dark:text-sky" />
                </div>
                <span className="text-sm text-navy dark:text-cream font-medium">
                  {name}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-steel/50 dark:text-sky/35">
                No matching icons found
              </p>
              <p className="text-[11px] text-steel/35 dark:text-sky/25 mt-0.5">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
