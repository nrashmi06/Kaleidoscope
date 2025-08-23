import { useMemo } from "react";
import  { CategorySettingsTab } from "./CategorySettingsTab";
// import { ThemeSettingsTab } from "./ThemeSettingsTab";
// import { VisibilitySettingsTab } from "./VisibilitySettingsTab";
import { UserPreferencesTab } from "./UserPreferencesTab";

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const tabs = [
  { label: "User Preferences", key: "preferences" },
  { label: "Category Settings", key: "category" },
  // { label: "Theme Settings", key: "theme" },
  // { label: "Visibility Settings", key: "visibility" },
];

export const SettingsTabs = ({ activeTab, onTabChange }: Props) => {

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "preferences":
        return <UserPreferencesTab />;
      case "category":
        return <CategorySettingsTab />;
      default:
        return <div className="text-red-500">Unknown tab</div>;
    }
  }, [activeTab]);

  return (
    <div>
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-150 ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderTabContent}</div>
    </div>
  );
};
