import React from "react";

interface Props {
  value: "PUBLIC" | "FOLLOWERS";
  onChange: (value: "PUBLIC" | "FOLLOWERS") => void;
}

export default function VisibilitySelect({ value, onChange }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Visibility
      </label>
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(e.target.value as "PUBLIC" | "FOLLOWERS")
        }
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <option value="PUBLIC">Public</option>
        <option value="FOLLOWERS">Followers</option>
      </select>
    </div>
  );
}
