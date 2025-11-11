// src/components/settings/SettingsTabs.tsx
"use client";

import { useMemo, Suspense } from "react";
import { CategorySettingsTab } from "./CategorySettingsTab";
import { UserPreferencesTab } from "./UserPreferencesTab";
import { useAppSelector } from "@/hooks/useAppSelector";

import { 
  BlockedUsersList 
} from "@/components/user-blocks/BlockedUsersList";
import { 
  BlockUserFormSkeleton 
} from "@/components/user-blocks/BlockUserForm"; 
// ✅ Import the new component
import { 
  UsersBlockedByList 
} from "@/components/user-blocks/UsersBlockedByList"; 

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const allTabs = [
  { label: "User Preferences", key: "preferences", adminOnly: false },
  // ✅ Renamed for clarity
  { label: "Blocked By Me", key: "blocked-by-me", adminOnly: false }, 
  // ✅ New "Blocked By Others" Tab
  { label: "Blocked By Others", key: "blocked-by-others", adminOnly: false }, 
  { label: "Category Settings", key: "category", adminOnly: true },
];

export const SettingsTabs = ({ activeTab, onTabChange }: Props) => {
  const role = useAppSelector((state) => state.auth.role);

  console.log('[SettingsTabs] Current user role:', role);

  const tabs = useMemo(() => {
    if (role === 'ADMIN') {
      console.log('[SettingsTabs] Admin detected, showing all tabs');
      return allTabs;
    }
    console.log('[SettingsTabs] Non-admin user, filtering tabs');
    return allTabs.filter(tab => !tab.adminOnly);
  }, [role]);

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "preferences":
        return <UserPreferencesTab />;
      
      // ✅ Renamed case
      case "blocked-by-me":
        return (
          <div className="max-w-7xl mx-auto flex items-start justify-center">
            <Suspense fallback={<BlockUserFormSkeleton />}> 
              <BlockedUsersList />
            </Suspense>
          </div>
        );

      // ✅ NEW CASE FOR "Blocked By Others"
      case "blocked-by-others":
        return (
          <div className="max-w-7xl mx-auto flex items-start justify-center">
            <Suspense fallback={<BlockUserFormSkeleton />}> 
              <UsersBlockedByList />
            </Suspense>
          </div>
        );

      case "category":
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
      <div className="flex border-b mb-6 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-150 ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-blue-500 dark:text-neutral-400 dark:hover:text-blue-400"
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