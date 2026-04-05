// src/components/settings/SettingsTabs.tsx
"use client";

import { useMemo, Suspense } from "react";
import {
  Sliders,
  UserX,
  ShieldOff,
  Layers,
  ShieldAlert,
  ShieldBan,
  Bell,
} from "lucide-react";
import { CategorySettingsTab } from "./CategorySettingsTab";
import { UserPreferencesTab } from "./UserPreferencesTab";
import { useAppSelector } from "@/hooks/useAppSelector";
import { BlockedUsersList } from "@/components/user-blocks/BlockedUsersList";
import { BlockUserFormSkeleton } from "@/components/user-blocks/BlockUserForm";
import { UsersBlockedByList } from "@/components/user-blocks/UsersBlockedByList";
import { NotificationPreferencesTab } from "./NotificationPreferencesTab";
import { AdminBlocksList } from "./AdminBlocksList";

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const allTabs = [
  { label: "Preferences", key: "preferences", icon: Sliders, adminOnly: false },
  { label: "Notifications", key: "notifications", icon: Bell, adminOnly: false },
  { label: "Blocked By Me", key: "blocked-by-me", icon: UserX, adminOnly: false },
  { label: "Blocked By Others", key: "blocked-by-others", icon: ShieldOff, adminOnly: false },
  { label: "Categories", key: "category", icon: Layers, adminOnly: true },
  { label: "All Blocks", key: "admin-blocks", icon: ShieldBan, adminOnly: true },
];

export const SettingsTabs = ({ activeTab, onTabChange }: Props) => {
  const role = useAppSelector((state) => state.auth.role);

  const tabs = useMemo(() => {
    if (role === "ADMIN") return allTabs;
    return allTabs.filter((tab) => !tab.adminOnly);
  }, [role]);

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "preferences":
        return <UserPreferencesTab />;

      case "notifications":
        return <NotificationPreferencesTab />;

      case "blocked-by-me":
        return (
          <Suspense fallback={<BlockUserFormSkeleton />}>
            <BlockedUsersList />
          </Suspense>
        );

      case "blocked-by-others":
        return (
          <Suspense fallback={<BlockUserFormSkeleton />}>
            <UsersBlockedByList />
          </Suspense>
        );

      case "category":
        if (role !== "ADMIN") {
          return (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center gap-3 p-8 bg-cream-50/50 dark:bg-navy-700/30 rounded-2xl border border-red-200/50 dark:border-red-900/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40">
                  <ShieldAlert className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-navy dark:text-cream">
                  Access Denied
                </h3>
                <p className="text-sm text-steel/60 dark:text-sky/40">
                  You need admin privileges to access category settings.
                </p>
              </div>
            </div>
          );
        }
        return <CategorySettingsTab />;

      case "admin-blocks":
        return <AdminBlocksList />;

      default:
        return null;
    }
  }, [activeTab, role]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Pill style */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-cream-100/60 dark:bg-navy-700/30 rounded-xl border border-cream-300/40 dark:border-navy-700/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                  : "text-steel/60 dark:text-sky/40 hover:text-steel dark:hover:text-sky hover:bg-cream-200/50 dark:hover:bg-navy-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>{renderTabContent}</div>
    </div>
  );
};
