import { useMemo } from "react";
import  { CategorySettingsTab } from "./CategorySettingsTab";
// import { ThemeSettingsTab } from "./ThemeSettingsTab";
// import { VisibilitySettingsTab } from "./VisibilitySettingsTab";
import { UserPreferencesTab } from "./UserPreferencesTab";
import { useAppSelector } from "@/hooks/useAppSelector";

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const allTabs = [
  { label: "User Preferences", key: "preferences", adminOnly: false },
  { label: "Category Settings", key: "category", adminOnly: true },
  // { label: "Theme Settings", key: "theme", adminOnly: false },
  // { label: "Visibility Settings", key: "visibility", adminOnly: false },
];

export const SettingsTabs = ({ activeTab, onTabChange }: Props) => {
  const role = useAppSelector((state) => state.auth.role);
  
  // Debug logging to check the role value
  console.log('[SettingsTabs] Current user role:', role);
  
  // Filter tabs based on user role
  const tabs = useMemo(() => {
    if (role === 'ADMIN') {
      console.log('[SettingsTabs] Admin detected, showing all tabs');
      return allTabs; // Admin sees all tabs
    }
    console.log('[SettingsTabs] Non-admin user, filtering tabs');
    return allTabs.filter(tab => !tab.adminOnly); // Regular users see only non-admin tabs
  }, [role]);

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "preferences":
        return <UserPreferencesTab />;
      case "category":
        // Only allow admin users to access category settings
        if (role !== 'ADMIN') {
          return (
            <div className="text-center py-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Access Denied
                </h3>
                <p className="text-red-600 dark:text-red-300">
                  You need admin privileges to access category settings.
                </p>
              </div>
            </div>
          );
        }
        return <CategorySettingsTab />;
      default:
        return <div className="text-red-500">Unknown tab</div>;
    }
  }, [activeTab, role]);

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
