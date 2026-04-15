import React from "react";
import { Heading1 } from "lucide-react";

const MAX_TITLE_LENGTH = 200;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TitleInput({ value, onChange }: Props) {
  const charCount = value.length;
  const isOverLimit = charCount > MAX_TITLE_LENGTH;
  const isNearLimit = charCount > MAX_TITLE_LENGTH * 0.85;

  return (
    <div className="
      bg-cream-50 dark:bg-navy-700/50
      rounded-xl border border-cream-300/40 dark:border-navy-700/40
      p-6 shadow-sm transition-all duration-300 hover:shadow-md
    ">
      <div className="flex items-center justify-between mb-3">
        <label
          className="
            block text-sm sm:text-base font-bold text-navy dark:text-cream
            transition-colors duration-200
          "
        >
          Title
          <span className="text-red-600 dark:text-red-400 ml-1">*</span>
        </label>
        <span className={`text-xs tabular-nums ${
          isOverLimit
            ? "text-red-500 font-semibold"
            : isNearLimit
            ? "text-amber-500"
            : "text-steel/50 dark:text-sky/40"
        }`}>
          {charCount}/{MAX_TITLE_LENGTH}
        </span>
      </div>

      <div className="relative">
        <Heading1 className="
          absolute left-3 top-1/2 transform -translate-y-1/2
          w-5 h-5 text-steel/40 dark:text-sky/30
        " />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Enter your post title..."
          className={`
            w-full pl-10 pr-4 py-3
            border rounded-lg
            bg-cream-50/60 dark:bg-navy-700/30
            text-navy dark:text-cream
            placeholder-steel/40 dark:placeholder-sky/30
            focus:ring-3 focus:ring-steel/30 focus:border-steel dark:focus:ring-sky/30 dark:focus:border-sky
            transition-all duration-300
            ${isOverLimit ? "border-red-400 dark:border-red-500" : "border-cream-300/40 dark:border-navy-700/40"}
          `}
          required
        />
      </div>
    </div>
  );
}