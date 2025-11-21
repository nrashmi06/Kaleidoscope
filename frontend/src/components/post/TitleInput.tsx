import React from "react";
import { Heading1 } from "lucide-react"; // Import an icon for context

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TitleInput({ value, onChange }: Props) {
  return (
    <div className="
      bg-white dark:bg-slate-800 
      rounded-xl border border-gray-200 dark:border-slate-700 
      p-6 shadow-lg transition-all duration-300 hover:shadow-xl
    ">
      <label 
        className="
          block text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200 
          mb-3 transition-colors duration-200
        "
      >
        Article Title
        <span className="text-red-600 dark:text-red-400 ml-1">*</span>
      </label>
      
      <div className="relative">
        {/* Icon for visual context */}
        <Heading1 className="
          absolute left-3 top-1/2 transform -translate-y-1/2 
          w-5 h-5 text-gray-400 dark:text-gray-500
        " />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your post title..."
          className="
            w-full pl-10 pr-4 py-3 
            border border-gray-300 dark:border-gray-700 
            rounded-lg 
            bg-gray-50 dark:bg-neutral-800 
            text-gray-900 dark:text-white 
            placeholder-gray-500 dark:placeholder-gray-400 
            focus:ring-3 focus:ring-blue-500/50 focus:border-blue-500 
            transition-all duration-300
            shadow-inner dark:shadow-none
          "
          required
        />
      </div>
    </div>
  );
}