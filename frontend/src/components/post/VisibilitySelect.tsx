import React from "react";

interface Props {
  value: "PUBLIC" | "FOLLOWERS";
  onChange: (value: "PUBLIC" | "FOLLOWERS") => void;
}

export default function VisibilitySelect({ value, onChange }: Props) {
  return (
    <div className="bg-surface-alt rounded-xl border border-border-default p-6">
      <label className="block text-sm font-medium text-heading mb-2">
        Visibility
      </label>
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(e.target.value as "PUBLIC" | "FOLLOWERS")
        }
        className="w-full px-4 py-3 border border-border-default rounded-xl bg-cream-50/60 dark:bg-navy-700/30 text-heading focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
      >
        <option value="PUBLIC">Public</option>
        <option value="FOLLOWERS">Followers</option>
      </select>
    </div>
  );
}
