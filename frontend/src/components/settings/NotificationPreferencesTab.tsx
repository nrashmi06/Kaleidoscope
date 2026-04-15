// src/components/settings/NotificationPreferencesTab.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Loader } from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import {
  Bell,
  Mail,
  Smartphone,
  MessageCircle,
  Heart,
  UserPlus,
  AtSign,
  Settings,
  RotateCcw,
} from "lucide-react";
import {
  getNotificationPreferencesController,
  updateChannelPreferencesController,
  resetNotificationPreferencesController,
  toggleAllEmailController,
  toggleAllPushController,
} from "@/controllers/notification-preferences/notificationPreferencesController";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChannelPreferences {
  email: boolean;
  push: boolean;
}

interface NotificationPreferences {
  comments: ChannelPreferences;
  likes: ChannelPreferences;
  follows: ChannelPreferences;
  mentions: ChannelPreferences;
  system: ChannelPreferences;
}

/** Parse flat backend response (commentsEmail, commentsPush, ...) into nested structure */
function parseBackendPrefs(raw: Record<string, unknown>): NotificationPreferences {
  const ch = (key: string): ChannelPreferences => ({
    email: raw[`${key}Email`] === true,
    push: raw[`${key}Push`] === true,
  });
  return {
    comments: ch("comments"),
    likes: ch("likes"),
    follows: ch("follows"),
    mentions: ch("mentions"),
    system: ch("system"),
  };
}

// ── Channel Config ─────────────────────────────────────────────────────────────

const channels = [
  {
    key: "comments" as const,
    label: "Comments",
    description: "Notifications when someone comments on your posts",
    icon: MessageCircle,
  },
  {
    key: "likes" as const,
    label: "Likes",
    description: "Notifications when someone likes your content",
    icon: Heart,
  },
  {
    key: "follows" as const,
    label: "Follows",
    description: "Notifications when someone follows you",
    icon: UserPlus,
  },
  {
    key: "mentions" as const,
    label: "Mentions",
    description: "Notifications when someone mentions you",
    icon: AtSign,
  },
  {
    key: "system" as const,
    label: "System",
    description: "System announcements and updates",
    icon: Settings,
  },
];

// ── Toggle Component ───────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled
          ? "bg-steel dark:bg-sky"
          : "bg-cream-300 dark:bg-navy-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isChannelPrefs(val: unknown): val is ChannelPreferences {
  return (
    typeof val === "object" &&
    val !== null &&
    typeof (val as ChannelPreferences).email === "boolean" &&
    typeof (val as ChannelPreferences).push === "boolean"
  );
}

const defaultChannel: ChannelPreferences = { email: true, push: true };

function safeChannel(prefs: NotificationPreferences, key: keyof NotificationPreferences): ChannelPreferences {
  return prefs[key] ?? defaultChannel;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const NotificationPreferencesTab = () => {
  const accessToken = useAccessToken();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await getNotificationPreferencesController(accessToken);
        if (res.success && res.data) {
          const raw = res.data as Record<string, unknown>;
          setPrefs(parseBackendPrefs(raw));
        } else {
          toast.error(res.message || "Failed to load notification preferences.");
        }
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading preferences."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [accessToken]);

  // Handle individual channel toggle
  const handleToggle = useCallback(
    async (
      channel: keyof NotificationPreferences,
      field: "email" | "push"
    ) => {
      if (!prefs || saving) return;

      const current = prefs[channel];
      const updated = { ...current, [field]: !current[field] };

      // Optimistic update
      setPrefs((prev) =>
        prev ? { ...prev, [channel]: updated } : prev
      );
      setSaving(`${channel}-${field}`);

      try {
        const res = await updateChannelPreferencesController(
          accessToken,
          channel,
          updated
        );
        if (res.success) {
          toast.success(
            `${channel.charAt(0).toUpperCase() + channel.slice(1)} ${field} ${
              updated[field] ? "enabled" : "disabled"
            }.`
          );
        } else {
          // Revert on failure
          setPrefs((prev) =>
            prev ? { ...prev, [channel]: current } : prev
          );
          toast.error(res.message || "Failed to update preference.");
        }
      } catch {
        // Revert on failure
        setPrefs((prev) =>
          prev ? { ...prev, [channel]: current } : prev
        );
        toast.error("An unexpected error occurred.");
      } finally {
        setSaving(null);
      }
    },
    [prefs, saving, accessToken]
  );

  // Handle master toggle for all email
  const handleToggleAllEmail = useCallback(
    async (enable: boolean) => {
      if (!prefs || saving) return;

      const previousPrefs = { ...prefs };
      // Optimistic update
      const updated = { ...prefs };
      for (const ch of channels) {
        updated[ch.key] = { ...updated[ch.key], email: enable };
      }
      setPrefs(updated);
      setSaving("all-email");

      try {
        const res = await toggleAllEmailController(accessToken, enable);
        if (res.success) {
          toast.success(
            `All email notifications ${enable ? "enabled" : "disabled"}.`
          );
        } else {
          setPrefs(previousPrefs);
          toast.error(res.message || "Failed to update email preferences.");
        }
      } catch {
        setPrefs(previousPrefs);
        toast.error("An unexpected error occurred.");
      } finally {
        setSaving(null);
      }
    },
    [prefs, saving, accessToken]
  );

  // Handle master toggle for all push
  const handleToggleAllPush = useCallback(
    async (enable: boolean) => {
      if (!prefs || saving) return;

      const previousPrefs = { ...prefs };
      // Optimistic update
      const updated = { ...prefs };
      for (const ch of channels) {
        updated[ch.key] = { ...updated[ch.key], push: enable };
      }
      setPrefs(updated);
      setSaving("all-push");

      try {
        const res = await toggleAllPushController(accessToken, enable);
        if (res.success) {
          toast.success(
            `All push notifications ${enable ? "enabled" : "disabled"}.`
          );
        } else {
          setPrefs(previousPrefs);
          toast.error(res.message || "Failed to update push preferences.");
        }
      } catch {
        setPrefs(previousPrefs);
        toast.error("An unexpected error occurred.");
      } finally {
        setSaving(null);
      }
    },
    [prefs, saving, accessToken]
  );

  // Handle reset to defaults
  const handleReset = useCallback(async () => {
    if (saving) return;

    setSaving("reset");
    try {
      const res = await resetNotificationPreferencesController(accessToken);
      if (res.success) {
        // Re-fetch after reset to get normalized data
        const fetchRes = await getNotificationPreferencesController(accessToken);
        if (fetchRes.success && fetchRes.data) {
          setPrefs(parseBackendPrefs(fetchRes.data as Record<string, unknown>));
        }
        toast.success("Notification preferences reset to defaults.");
      } else {
        toast.error(res.message || "Failed to reset preferences.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(null);
    }
  }, [saving, accessToken]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <Loader />;

  if (!prefs) {
    return (
      <div className="text-center py-8 text-red-500 dark:text-red-400">
        Failed to load notification preferences.
      </div>
    );
  }

  const allEmailEnabled = channels.every((ch) => safeChannel(prefs, ch.key).email);
  const allPushEnabled = channels.every((ch) => safeChannel(prefs, ch.key).push);

  return (
    <div className="space-y-6">
      {/* ── Section 1: Master Toggles ── */}
      <div className="p-6 rounded-2xl bg-surface border border-border-default">
        <h3 className="text-base font-bold text-heading flex items-center gap-2 mb-5">
          <Bell className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Quick Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* All Email Toggle */}
          <div
            className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
              allEmailEnabled
                ? "bg-steel/5 dark:bg-sky/5 border-steel/20 dark:border-sky/20"
                : "bg-cream-100/40 dark:bg-navy-700/20 border-border-subtle"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                  allEmailEnabled
                    ? "bg-steel/10 dark:bg-sky/10"
                    : "bg-cream-300/30 dark:bg-navy-600/30"
                }`}
              >
                <Mail
                  className={`w-4 h-4 ${
                    allEmailEnabled
                      ? "text-steel dark:text-sky"
                      : "text-steel/40 dark:text-sky/30"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-heading block">
                  All Email Notifications
                </span>
                <span className="text-[11px] text-steel/50 dark:text-sky/30 block truncate">
                  {allEmailEnabled ? "All enabled" : "Some or all disabled"}
                </span>
              </div>
            </div>
            <Toggle
              enabled={allEmailEnabled}
              onToggle={() => handleToggleAllEmail(!allEmailEnabled)}
              disabled={saving !== null}
            />
          </div>

          {/* All Push Toggle */}
          <div
            className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
              allPushEnabled
                ? "bg-steel/5 dark:bg-sky/5 border-steel/20 dark:border-sky/20"
                : "bg-cream-100/40 dark:bg-navy-700/20 border-border-subtle"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                  allPushEnabled
                    ? "bg-steel/10 dark:bg-sky/10"
                    : "bg-cream-300/30 dark:bg-navy-600/30"
                }`}
              >
                <Smartphone
                  className={`w-4 h-4 ${
                    allPushEnabled
                      ? "text-steel dark:text-sky"
                      : "text-steel/40 dark:text-sky/30"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-heading block">
                  All Push Notifications
                </span>
                <span className="text-[11px] text-steel/50 dark:text-sky/30 block truncate">
                  {allPushEnabled ? "All enabled" : "Some or all disabled"}
                </span>
              </div>
            </div>
            <Toggle
              enabled={allPushEnabled}
              onToggle={() => handleToggleAllPush(!allPushEnabled)}
              disabled={saving !== null}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Per-Channel Preferences ── */}
      <div className="p-6 rounded-2xl bg-surface border border-border-default">
        <h3 className="text-base font-bold text-heading flex items-center gap-2 mb-5">
          <Settings className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Channel Preferences
        </h3>

        <div className="space-y-3">
          {channels.map(({ key, label, description, icon: Icon }) => {
            const channelPrefs = safeChannel(prefs, key);
            return (
              <div
                key={key}
                className="p-4 rounded-xl bg-cream-100/40 dark:bg-navy-700/20 border border-border-subtle"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-steel/10 dark:bg-sky/10">
                    <Icon className="w-4 h-4 text-steel dark:text-sky" />
                  </div>

                  {/* Label + description + toggles */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-heading block">
                      {label}
                    </span>
                    <span className="text-[11px] text-steel/50 dark:text-sky/30 block mb-3">
                      {description}
                    </span>

                    <div className="flex flex-wrap items-center gap-6">
                      {/* Email toggle */}
                      <div className="flex items-center gap-2">
                        <Mail
                          className={`w-3.5 h-3.5 ${
                            channelPrefs.email
                              ? "text-steel dark:text-sky"
                              : "text-steel/40 dark:text-sky/30"
                          }`}
                        />
                        <span className="text-xs font-medium text-heading">
                          Email
                        </span>
                        <Toggle
                          enabled={channelPrefs.email}
                          onToggle={() => handleToggle(key, "email")}
                          disabled={saving !== null}
                        />
                      </div>

                      {/* Push toggle */}
                      <div className="flex items-center gap-2">
                        <Smartphone
                          className={`w-3.5 h-3.5 ${
                            channelPrefs.push
                              ? "text-steel dark:text-sky"
                              : "text-steel/40 dark:text-sky/30"
                          }`}
                        />
                        <span className="text-xs font-medium text-heading">
                          Push
                        </span>
                        <Toggle
                          enabled={channelPrefs.push}
                          onToggle={() => handleToggle(key, "push")}
                          disabled={saving !== null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Reset to Defaults ── */}
      <div className="p-6 rounded-2xl bg-surface border border-border-default">
        <h3 className="text-base font-bold text-heading flex items-center gap-2 mb-4">
          <RotateCcw className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Reset
        </h3>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-cream-100/50 dark:bg-navy-700/20 border border-border-subtle">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-heading mb-1">
              Reset to Defaults
            </h4>
            <p className="text-xs text-steel/60 dark:text-sky/40 leading-relaxed">
              Restore all notification preferences to their default settings.
              This will enable all notification channels.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={saving !== null}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cream-50 bg-steel hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky/80 shadow-sm shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${saving === "reset" ? "animate-spin" : ""}`}
            />
            {saving === "reset" ? "Resetting..." : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
};
