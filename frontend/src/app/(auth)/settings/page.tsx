'use client';

import { useState, useEffect } from "react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useAppSelector } from "@/hooks/useAppSelector";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("preferences");
  const role = useAppSelector((state) => state.auth.role);

  // Redirect non-admin users from category tab to preferences
  useEffect(() => {
    if (activeTab === "category" && role !== 'ADMIN') {
      setActiveTab("preferences");
    }
  }, [activeTab, role]);

  return (
    <div className="max-w-full mx-4 sm:mx-2 md:mx-auto p-3">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
