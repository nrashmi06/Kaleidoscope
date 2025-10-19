import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BodyInput({ value, onChange }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Body *
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your post content..."
        rows={8}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        required
      />
    </div>
  );
}
