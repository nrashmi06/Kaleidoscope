// src/components/user/UserProfileHeader.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldAlert } from "lucide-react";
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
      {/* Cover Photo */}
      <div className="h-48 w-full bg-gray-100 dark:bg-neutral-800 overflow-hidden relative rounded-t-xl">
        <Image
          src={profile.coverPhotoUrl}
          alt="Cover photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Profile Info Block */}
      <div className="px-8 pb-6">
        {/* Avatar & Action Row */}
        <div className="flex justify-between items-end mb-4">
          {/* Avatar */}
          <div className="w-32 h-32 -mt-16 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 shadow-lg relative z-10 bg-gray-300 dark:bg-neutral-700">
            <Image
              src={profile.profilePictureUrl}
              alt={profile.username}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action Buttons Logic */}
          <div className="flex space-x-3 pb-2">
            {isOwner ? (
              // Case 0: You are the owner
              <button
                onClick={handleEditProfile}
                className="px-5 py-2.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md"
              >
                Edit Profile
              </button>
            ) : blockStatus?.isBlockedBy ? (
              // Case 1: You are blocked by this user
              <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-neutral-700">
                <ShieldAlert className="w-4 h-4" />
                You are blocked
              </div>
            ) : (
              // Case 2 & 3: You have blocked them OR no block
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

        {/* Text Details */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {profile.username}
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          </h1>
          <p className="text-lg font-medium text-gray-700 dark:text-neutral-300">
            {profile.designation}
          </p>
          <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
            {profile.summary}
          </p>
        </div>
      </div>
    </div>
  );
}