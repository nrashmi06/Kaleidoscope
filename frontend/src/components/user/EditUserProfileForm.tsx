// src/components/user/EditUserProfileForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { updateUserProfileController } from "@/controllers/userController/updateUserProfileController";
import {
  UserProfileUpdateRequest,
  UserProfileUpdateUserData,
} from "@/lib/types/userProfileUpdate";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import {
  User,
  Briefcase,
  Info,
  Camera,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getUserProfileController } from "@/controllers/userController/getUserProfileController";
import { MappedUserProfile } from "@/lib/types/userProfile";

const DEFAULT_PROFILE_PIC = "/person.png";
const DEFAULT_COVER_PHOTO = "/default-cover.jpg";

function getFilePreviewUrl(file: File | null): string {
  if (file) {
    return URL.createObjectURL(file);
  }
  return "";
}

export function EditUserProfileForm() {
  const accessToken = useAccessToken();
  const currentUser = useUserData();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  const [fetchedProfile, setFetchedProfile] =
    useState<MappedUserProfile | null>(null);

  const [form, setForm] = useState<UserProfileUpdateUserData>({
    username: "",
    designation: "",
    summary: "",
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (!currentUser.userId || !accessToken) {
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);
    try {
      const result = await getUserProfileController(
        currentUser.userId,
        accessToken
      );

      if (result.success && result.data) {
        const profile = result.data;
        setFetchedProfile(profile);

        setForm({
          username: profile.username || "",
          designation: profile.designation || "",
          summary: profile.summary || "",
        });
      } else {
        const defaultMappedProfile: MappedUserProfile = {
          userId: currentUser.userId,
          username: currentUser.username,
          profilePictureUrl:
            currentUser.profilePictureUrl || DEFAULT_PROFILE_PIC,
          coverPhotoUrl: DEFAULT_COVER_PHOTO,
          designation: "",
          summary: "",
          followerCount: 0,
          followingCount: 0,
          isPrivate: false,
          followStatus: "NOT_FOLLOWING",
          posts: {
            content: [],
            page: 0,
            size: 0,
            totalPages: 0,
            totalElements: 0,
            first: true,
            last: true,
          },
        };

        setFetchedProfile(defaultMappedProfile);
        toast.error(result.message || "Failed to load profile details.");
      }
    } catch (err) {
      console.error("[EditUserProfileForm] Error fetching profile data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser, accessToken]);

  useEffect(() => {
    if (currentUser.userId && accessToken) {
      fetchProfileData();
    }
  }, [currentUser.userId, accessToken, fetchProfileData]);

  useEffect(() => {
    return () => {
      if (profilePictureFile)
        URL.revokeObjectURL(getFilePreviewUrl(profilePictureFile));
      if (coverPhotoFile)
        URL.revokeObjectURL(getFilePreviewUrl(coverPhotoFile));
    };
  }, [profilePictureFile, coverPhotoFile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePicture" | "coverPhoto"
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      e.target.value = "";
      return;
    }

    if (field === "profilePicture") {
      if (profilePictureFile)
        URL.revokeObjectURL(getFilePreviewUrl(profilePictureFile));
      setProfilePictureFile(file);
    } else {
      if (coverPhotoFile)
        URL.revokeObjectURL(getFilePreviewUrl(coverPhotoFile));
      setCoverPhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error("You must be logged in to update your profile.");
      return;
    }

    if (!form.username.trim() || form.summary.length > 500) {
      toast.error(
        "Please ensure username is not empty and summary is under 500 characters."
      );
      return;
    }

    setIsLoading(true);

    const requestData: UserProfileUpdateRequest = {
      profilePicture: profilePictureFile,
      coverPhoto: coverPhotoFile,
      userData: form,
    };

    try {
      const result = await updateUserProfileController(
        requestData,
        accessToken
      );

      if (result.success) {
        toast.success(result.message);
        setProfilePictureFile(null);
        setCoverPhotoFile(null);
        await fetchProfileData();
      } else {
        toast.error(result.errors.join(", ") || result.message);
      }
    } catch (error) {
      console.error("[EditUserProfileForm] Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProfilePicUrl = profilePictureFile
    ? getFilePreviewUrl(profilePictureFile)
    : fetchedProfile?.profilePictureUrl || DEFAULT_PROFILE_PIC;

  const currentCoverPhotoSource = coverPhotoFile
    ? getFilePreviewUrl(coverPhotoFile)
    : fetchedProfile?.coverPhotoUrl;

  const showCoverPlaceholder = !currentCoverPhotoSource;

  if (isRefreshing || !fetchedProfile) {
    return (
      <div className="p-8 text-center rounded-2xl bg-surface border border-border-default">
        <Loader2 className="w-7 h-7 animate-spin mx-auto text-steel dark:text-sky" />
        <p className="text-sm text-steel/60 dark:text-sky/40 mt-3">
          Loading current profile data...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Photos Section ── */}
      <div className="rounded-2xl bg-surface border border-border-default overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-base font-bold text-heading flex items-center gap-2">
            <Camera className="w-4.5 h-4.5 text-steel dark:text-sky" />
            Photos
          </h3>
          <button
            type="button"
            onClick={fetchProfileData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-steel dark:text-sky bg-steel/8 dark:bg-sky/8 hover:bg-steel/15 dark:hover:bg-sky/15 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Cover Photo */}
        <div className="relative h-44 w-full bg-cream-300/30 dark:bg-navy-700/60 overflow-hidden group mx-0">
          {showCoverPlaceholder ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-steel/40 dark:text-sky/25">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-sm">No Cover Photo Set</p>
            </div>
          ) : (
            <Image
              src={currentCoverPhotoSource}
              alt="Cover Preview"
              fill
              className="object-cover transition-opacity duration-300 group-hover:opacity-60"
              sizes="(max-width: 768px) 100vw, 800px"
              unoptimized={!!coverPhotoFile}
            />
          )}

          <label
            htmlFor="coverPhoto"
            className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all z-10 ${
              !showCoverPlaceholder &&
              "opacity-0 group-hover:opacity-100 bg-navy/40"
            }`}
          >
            <span
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                showCoverPlaceholder
                  ? "text-steel bg-cream-100/70 dark:bg-navy-700/60 dark:text-sky border border-cream-300/40 dark:border-navy-600/40"
                  : "text-cream-50 bg-navy/60"
              }`}
            >
              {showCoverPlaceholder ? "Add Cover Photo" : "Change Cover"}
            </span>
            <input
              id="coverPhoto"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "coverPhoto")}
              className="sr-only"
              disabled={isLoading}
            />
          </label>

          {coverPhotoFile && (
            <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-sky/90 text-navy px-2 py-0.5 rounded z-20">
              NEW FILE
            </span>
          )}
        </div>

        {/* Profile Picture */}
        <div className="flex items-end justify-center -mt-14 pb-5">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-cream dark:border-navy-900 shadow-lg bg-cream-300 dark:bg-navy-600 group ring-2 ring-steel/10 dark:ring-sky/10">
            <Image
              src={currentProfilePicUrl}
              alt="Profile Preview"
              width={112}
              height={112}
              className="object-cover transition-opacity duration-300 group-hover:opacity-60"
              unoptimized={!!profilePictureFile}
            />

            <label
              htmlFor="profilePicture"
              className="absolute inset-0 flex items-center justify-center text-cream-50 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-navy/40"
            >
              <Camera className="w-6 h-6" />
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "profilePicture")}
                className="sr-only"
                disabled={isLoading}
              />
            </label>
            {profilePictureFile && (
              <span className="absolute top-0 right-0 text-[10px] font-semibold bg-sky text-navy px-1.5 py-0.5 rounded-bl">
                NEW
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Account Details Section ── */}
      <div className="p-6 rounded-2xl bg-surface border border-border-default space-y-5">
        <h3 className="text-base font-bold text-heading flex items-center gap-2">
          <User className="w-4.5 h-4.5 text-steel dark:text-sky" />
          Account Details
        </h3>

        {/* Username */}
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="flex items-center gap-1.5 text-sm font-semibold text-heading"
          >
            <User className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
            Username *
          </label>
          <input
            id="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-heading text-sm focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Designation */}
        <div className="space-y-1.5">
          <label
            htmlFor="designation"
            className="flex items-center gap-1.5 text-sm font-semibold text-heading"
          >
            <Briefcase className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
            Designation
          </label>
          <input
            id="designation"
            type="text"
            value={form.designation}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-heading text-sm focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Summary */}
        <div className="space-y-1.5">
          <label
            htmlFor="summary"
            className="flex items-center gap-1.5 text-sm font-semibold text-heading"
          >
            <Info className="w-3.5 h-3.5 text-steel/60 dark:text-sky/50" />
            Summary (Bio)
          </label>
          <textarea
            id="summary"
            value={form.summary}
            onChange={handleChange}
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-heading text-sm focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all resize-none"
            disabled={isLoading}
          />
          <span className="text-[11px] text-steel/40 dark:text-sky/30 block text-right">
            {form.summary.length}/500
          </span>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isLoading || isRefreshing}
        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Update Profile
          </>
        )}
      </button>
    </form>
  );
}
