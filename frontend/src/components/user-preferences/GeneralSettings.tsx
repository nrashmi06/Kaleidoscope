// components/user-preferences/GeneralSettings.tsx
import { UpdateUserPreferencesData } from "@/lib/types/settings/user-preferences";

type Props = {
  form: UpdateUserPreferencesData;
  onChange: <K extends keyof UpdateUserPreferencesData>(key: K, value: UpdateUserPreferencesData[K]) => void;
};

export const GeneralSettings = ({ form, onChange }: Props) => (
  <div className="space-y-8">
    <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
      ⚙️ General Settings
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Language Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">🌐 Language</label>
        <select
          value={form.language}
          onChange={(e) => onChange("language", e.target.value)}
          className="form-select"
        >
          <option value="en-US">English (US)</option>
          <option value="es-ES">Spanish (ES)</option>
        </select>
      </div>

      {/* Theme Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">🎨 Theme</label>
        <select
          value={form.theme}
          onChange={(e) => onChange("theme", e.target.value as UpdateUserPreferencesData["theme"])}
          className="form-select"
        >
          <option value="LIGHT">Light</option>
          <option value="DARK">Dark</option>
          <option value="SYSTEM">System</option>
        </select>
      </div>
    </div>
  </div>
);
