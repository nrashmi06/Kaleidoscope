// src/components/user/UserProfileHeader.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { type MappedUserProfile } from "@/lib/types/userProfile";
import { type UserBlockStatusData } from "@/lib/types/userBlockStatus";
import FollowButton from "@/components/common/FollowButton";
import BlockButton from "@/components/common/BlockButton";

interface UserProfileHeaderProps {
  profile: MappedUserProfile;
  isOwner: boolean;
  blockStatus: UserBlockStatusData | null;
}

export function UserProfileHeader({
  profile,
  isOwner,
  blockStatus,
}: UserProfileHeaderProps) {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push("/settings/profile-edit");
  };

  return (
    <div className="relative">
      {/* Cover Photo — full bleed with soft gradient overlay */}
      <div className="h-48 sm:h-56 w-full bg-cream-300/30 dark:bg-navy-700/60 overflow-hidden relative">
        <Image
          src={profile.coverPhotoUrl}
          alt="Cover photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream-50/80 dark:to-navy-900/80" />
      </div>

      {/* Profile Info — overlapping the cover */}
      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 -mt-16">
        <div className="flex flex-col items-center text-center">
          {/* Avatar — centered, large, Pinterest-style circle */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cream-50 dark:border-navy-900 shadow-xl relative z-10 bg-cream-300 dark:bg-navy-600 ring-2 ring-cream-300/40 dark:ring-navy-700/40">
            <Image
              src={profile.profilePictureUrl}
              alt={profile.username}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name */}
          <h1 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-navy dark:text-cream tracking-tight">
            {profile.username}
          </h1>

          {/* Designation */}
          {profile.designation && (
            <p className="mt-1 text-sm font-medium text-steel/70 dark:text-sky/50 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {profile.designation}
            </p>
          )}

          {/* Bio */}
          {profile.summary && (
            <p className="mt-2.5 text-sm text-navy/60 dark:text-cream/50 leading-relaxed max-w-lg">
              {profile.summary}
            </p>
          )}

          {/* Action Buttons — centered, Pinterest pill style */}
          <div className="mt-5 flex items-center gap-2.5">
            {isOwner ? (
              <button
                onClick={handleEditProfile}
                className="h-10 px-6 text-sm font-semibold rounded-full bg-cream-300/50 dark:bg-navy-700/50 text-navy dark:text-cream border border-cream-400/30 dark:border-navy-600/30 hover:bg-cream-300/70 dark:hover:bg-navy-700/70 transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            ) : blockStatus?.isBlockedBy ? (
              <div className="h-10 flex items-center gap-2 px-5 text-sm font-semibold rounded-full bg-cream-300/30 dark:bg-navy-700/30 text-steel/50 dark:text-sky/35 border border-cream-300/40 dark:border-navy-700/40">
                You are blocked
              </div>
            ) : (
              <>
                <FollowButton targetUserId={profile.userId} />
                <BlockButton
                  targetUserId={profile.userId}
                  targetUsername={profile.username}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
