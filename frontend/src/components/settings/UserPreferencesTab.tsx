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
import { RefreshCw } from "lucide-react";


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
      setMessage(res.success ? "Preferences updated successfully!" : `Error: ${res.message}`);
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
      // Clear the interest selection flag in Redux
      dispatch(clearInterestSelection());
      
      // Show success message
      toast.success("Category selection reset! Redirecting to category selection...");
      
      // Redirect to category selection page after a short delay
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
  if (!form) return <div className="text-red-500">Failed to load preferences.</div>;

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg border border-zinc-200 dark:border-zinc-600 max-w-full mx-auto space-y-10">
      {/* Header */}
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">User Preferences</h2>

      {/* Language & Theme Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Language
          </label>
          <select
            value={form.language}
            onChange={(e) => handleChange("language", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en-US">English (US)</option>
            <option value="es-ES">Spanish (ES)</option>
          </select>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Theme
          </label>
          <select
            value={form.theme}
            onChange={(e) => handleChange("theme", e.target.value as "LIGHT" | "DARK" | "SYSTEM")}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LIGHT">Light</option>
            <option value="DARK">Dark</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Privacy Toggles Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-800 dark:text-white">Privacy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {["showEmail", "showPhone", "showOnlineStatus", "searchDiscoverable"].map((key) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </span>
              <button
                onClick={() =>
                  handleChange(
                    key as keyof UpdateUserPreferencesData,
                    !(form[key as keyof UpdateUserPreferencesData] as boolean)
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form[key as keyof UpdateUserPreferencesData]
                    ? "bg-blue-600"
                    : "bg-zinc-400 dark:bg-zinc-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    form[key as keyof UpdateUserPreferencesData] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Controls Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-zinc-800 dark:text-white">Visibility</h3>
        {(["profileVisibility", "allowMessages", "allowTagging", "viewActivity"] as const).map(
          (key) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </label>
              <select
                value={form[key]}
                onChange={(e) =>
                  handleChange(
                    key,
                    e.target.value as "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE"
                  )
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="FRIENDS_ONLY">Friends Only</option>
                <option value="NO_ONE">No One</option>
              </select>
            </div>
          )
        )}
      </div>

      {/* Category Management Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Interest Categories</h3>
        <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Reconfigure Categories</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Want to change your interests? Reset your category selection to choose new categories that match your preferences.
              </p>
            </div>
            <button
              onClick={handleResetCategories}
              disabled={resettingCategories}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${resettingCategories ? 'animate-spin' : ''}`} />
              {resettingCategories ? "Resetting..." : "Reset Categories"}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button Section */}
      <div className="pt-6 flex items-center justify-between">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {message && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        )}
      </div>
    </div>
  );
};
