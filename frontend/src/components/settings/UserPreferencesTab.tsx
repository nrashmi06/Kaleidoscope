// src/components/settings/UserPreferencesTab.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDispatch } from "react-redux";
import { clearInterestSelection } from "@/store/authSlice";
import { UpdateUserPreferencesData } from "@/lib/types/settings/user-preferences";
import { updateUserPreferencesController } from "@/controllers/userPreferencesController/updateUserPreferences";
import { getUserPreferencesByIdAdminController } from "@/controllers/userPreferencesController/getUserPreferencesByIdAdminController";
import { Loader } from "@/components/common/Loader";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { changePasswordController } from "@/controllers/auth/changePasswordController";
import {
  Globe,
  Palette,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Sparkles,
  Mail,
  Search,
  Users,
  Tag,
  Activity,
  Check,
  Lock,
} from "lucide-react";

const privacyFields = [
  { key: "showEmail", label: "Show Email", icon: Mail, description: "Display your email on profile" },
  { key: "searchDiscoverable", label: "Search Discoverable", icon: Search, description: "Appear in search results" },
] as const;

const visibilityFields = [
  { key: "profileVisibility", label: "Profile Visibility", icon: Eye },
  { key: "allowTagging", label: "Allow Tagging", icon: Tag },
  { key: "viewActivity", label: "View Activity", icon: Activity },
] as const;

const visibilityOptions = [
  { value: "PUBLIC", label: "Public", icon: Globe },
  { value: "FRIENDS_ONLY", label: "Friends Only", icon: Users },
  { value: "NO_ONE", label: "No One", icon: Shield },
] as const;

export const UserPreferencesTab = () => {
  const { userId } = useAppSelector((state) => state.auth);
  const accessToken = useAccessToken();
  const dispatch = useDispatch();
  const router = useRouter();
  const [form, setForm] = useState<UpdateUserPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingCategories, setResettingCategories] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { setTheme } = useTheme();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setMessage("User ID not found.");
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const res = await getUserPreferencesByIdAdminController({ userId }, accessToken);
        if (res.success && res.data) {
          setForm(res.data);
        } else {
          setMessage("Failed to load preferences: " + res.message);
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading preferences."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  const handleChange = <K extends keyof UpdateUserPreferencesData>(
    key: K,
    value: UpdateUserPreferencesData[K]
  ) => {
    if (!form) return;
    setForm((prev) => ({ ...prev!, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await updateUserPreferencesController(form, accessToken);
      if (res.success && res.data?.theme) {
        const pref = res.data.theme;
        if (pref === "LIGHT") setTheme("light");
        else if (pref === "DARK") setTheme("dark");
        else if (pref === "SYSTEM") setTheme("system");
      }
      setMessage(
        res.success ? "Preferences updated successfully!" : `Error: ${res.message}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving preferences."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetCategories = async () => {
    if (resettingCategories) return;
    setResettingCategories(true);
    try {
      dispatch(clearInterestSelection());
      toast.success("Category selection reset! Redirecting to category selection...");
      setTimeout(() => {
        router.push("/onboarding/categories");
      }, 1500);
    } catch (error) {
      console.error("Error resetting categories:", error);
      toast.error("Failed to reset category selection");
    } finally {
      setResettingCategories(false);
    }
  };

  if (loading) return <Loader />;
  if (!form)
    return (
      <div className="text-center py-8 text-red-500 dark:text-red-400">
        Failed to load preferences.
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Section 1: Language & Theme ── */}
      <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
        <h3 className="text-base font-bold text-navy dark:text-cream flex items-center gap-2 mb-5">
          <Palette className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Appearance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Language */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
              <Globe className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
              Language
            </label>
            <select
              value={form.language}
              onChange={(e) => handleChange("language", e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all appearance-none cursor-pointer"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish (ES)</option>
            </select>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
              <Palette className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
              Theme
            </label>
            <select
              value={form.theme}
              onChange={(e) =>
                handleChange("theme", e.target.value as "LIGHT" | "DARK" | "SYSTEM")
              }
              className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all appearance-none cursor-pointer"
            >
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Privacy Toggles ── */}
      <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
        <h3 className="text-base font-bold text-navy dark:text-cream flex items-center gap-2 mb-5">
          <Shield className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Privacy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privacyFields.map(({ key, label, icon: Icon, description }) => {
            const isOn = form[key as keyof UpdateUserPreferencesData] as boolean;
            return (
              <div
                key={key}
                className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                  isOn
                    ? "bg-steel/5 dark:bg-sky/5 border-steel/20 dark:border-sky/20"
                    : "bg-cream-100/40 dark:bg-navy-700/20 border-cream-300/30 dark:border-navy-700/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                      isOn
                        ? "bg-steel/10 dark:bg-sky/10"
                        : "bg-cream-300/30 dark:bg-navy-600/30"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isOn
                          ? "text-steel dark:text-sky"
                          : "text-steel/40 dark:text-sky/30"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-navy dark:text-cream block">
                      {label}
                    </span>
                    <span className="text-[11px] text-steel/50 dark:text-sky/30 block truncate">
                      {description}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleChange(key as keyof UpdateUserPreferencesData, !isOn)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors cursor-pointer ${
                    isOn ? "bg-steel dark:bg-sky" : "bg-cream-400/50 dark:bg-navy-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-navy-900 transition-transform shadow-sm ${
                      isOn ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Visibility Controls ── */}
      <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
        <h3 className="text-base font-bold text-navy dark:text-cream flex items-center gap-2 mb-5">
          <Eye className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Visibility
        </h3>

        <div className="space-y-4">
          {visibilityFields.map(({ key, label, icon: FieldIcon }) => {
            const currentValue = form[key] as string;
            return (
              <div key={key} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
                  <FieldIcon className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
                  {label}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {visibilityOptions.map((opt) => {
                    const isActive = currentValue === opt.value;
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          handleChange(
                            key,
                            opt.value as "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE"
                          )
                        }
                        className={`relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isActive
                            ? "bg-steel/10 dark:bg-sky/10 border-steel/30 dark:border-sky/30 text-navy dark:text-cream"
                            : "bg-cream-100/40 dark:bg-navy-700/20 border-cream-300/30 dark:border-navy-700/30 text-steel/50 dark:text-sky/35 hover:border-steel/20 dark:hover:border-sky/20"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-steel dark:bg-sky flex items-center justify-center">
                            <Check className="w-2 h-2 text-cream-50 dark:text-navy" />
                          </span>
                        )}
                        <OptIcon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Interest Categories ── */}
      <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
        <h3 className="text-base font-bold text-navy dark:text-cream flex items-center gap-2 mb-4">
          <Sparkles className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Interest Categories
        </h3>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-cream-100/50 dark:bg-navy-700/20 border border-cream-300/30 dark:border-navy-700/30">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-navy dark:text-cream mb-1">
              Reconfigure Categories
            </h4>
            <p className="text-xs text-steel/60 dark:text-sky/40 leading-relaxed">
              Reset your category selection to choose new categories that match
              your preferences.
            </p>
          </div>
          <button
            onClick={handleResetCategories}
            disabled={resettingCategories}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cream-50 bg-steel hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky/80 shadow-sm shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${resettingCategories ? "animate-spin" : ""}`}
            />
            {resettingCategories ? "Resetting..." : "Reset"}
          </button>
        </div>
      </div>

      {/* ── Section 5: Security ── */}
      <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
        <h3 className="text-base font-bold text-navy dark:text-cream flex items-center gap-2 mb-5">
          <Lock className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Security
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-navy dark:text-cream">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel/50 dark:text-sky/40 hover:text-steel dark:hover:text-sky transition-colors cursor-pointer"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-navy dark:text-cream">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel/50 dark:text-sky/40 hover:text-steel dark:hover:text-sky transition-colors cursor-pointer"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Password message */}
        {passwordMessage && (
          <p
            className={`mt-3 text-sm font-medium ${
              passwordMessage.startsWith("Error")
                ? "text-red-500"
                : "text-steel dark:text-sky"
            }`}
          >
            {passwordMessage}
          </p>
        )}

        {/* Change Password button */}
        <div className="mt-5">
          <button
            onClick={async () => {
              if (!currentPassword || !newPassword) {
                toast.error("Both password fields are required.");
                return;
              }
              if (newPassword.length < 8) {
                toast.error("New password must be at least 8 characters.");
                return;
              }
              setChangingPassword(true);
              setPasswordMessage(null);
              try {
                const res = await changePasswordController(
                  { currentPassword, newPassword },
                  accessToken
                );
                if (res.success) {
                  toast.success(res.message);
                  setPasswordMessage(res.message);
                  setCurrentPassword("");
                  setNewPassword("");
                } else {
                  toast.error(res.message);
                  setPasswordMessage(`Error: ${res.message}`);
                }
              } catch {
                toast.error("An unexpected error occurred.");
                setPasswordMessage("Error: An unexpected error occurred.");
              } finally {
                setChangingPassword(false);
              }
            }}
            disabled={changingPassword}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {message && (
          <p
            className={`text-sm font-medium ${
              message.startsWith("Error")
                ? "text-red-500"
                : "text-steel dark:text-sky"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
