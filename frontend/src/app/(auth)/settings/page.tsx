'use client';

import { useState } from "react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("preferences");

  return (
    <div className="max-w-full mx-4 sm:mx-2 md:mx-auto p-3">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
