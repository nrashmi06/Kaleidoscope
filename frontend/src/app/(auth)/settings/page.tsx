"use client";

import { useState, useEffect } from "react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useAppSelector } from "@/hooks/useAppSelector";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("preferences");
  const role = useAppSelector((state) => state.auth.role);

  useEffect(() => {
    if (activeTab === "category" && role !== "ADMIN") {
      setActiveTab("preferences");
    }
  }, [activeTab, role]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="pt-6 pb-5 px-1">
        <h1 className="text-2xl font-display font-bold text-heading tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-steel/50 dark:text-sky/35">
          Manage your preferences, privacy, and account
        </p>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
