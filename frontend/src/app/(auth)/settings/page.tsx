"use client";

import { useState, useEffect } from "react";
import { Settings, Sparkles } from "lucide-react";
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
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-6 relative min-h-screen">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-sky shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <Settings className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-navy dark:text-cream flex items-center gap-2">
              Settings
              <Sparkles className="w-4 h-4 text-steel/40 dark:text-sky/30" />
            </h1>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              Manage your preferences, privacy, and account
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
