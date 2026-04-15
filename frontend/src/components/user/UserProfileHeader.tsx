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
      <div className="h-52 w-full bg-cream-300/30 dark:bg-navy-700/60 overflow-hidden relative rounded-2xl">
        <Image
          src={profile.coverPhotoUrl}
          alt="Cover photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="px-6 sm:px-8 pb-6">
        {/* Avatar & Actions */}
        <div className="flex justify-between items-end mb-4">
          {/* Avatar */}
          <div className="w-28 h-28 -mt-14 rounded-full overflow-hidden border-4 border-cream dark:border-navy-900 shadow-lg relative z-10 bg-cream-300 dark:bg-navy-600 ring-2 ring-steel/10 dark:ring-sky/10">
            <Image
              src={profile.profilePictureUrl}
              alt={profile.username}
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pb-2">
            {isOwner ? (
              <button
                onClick={handleEditProfile}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-steel text-cream-50 hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky/80 transition-all shadow-sm shadow-steel/20 dark:shadow-sky/15 cursor-pointer"
              >
                Edit Profile
              </button>
            ) : blockStatus?.isBlockedBy ? (
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-cream-300/50 dark:bg-navy-700/50 text-steel/60 dark:text-sky/40 border border-cream-300/40 dark:border-navy-700/40">
                <ShieldAlert className="w-4 h-4" />
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

        {/* Name & Bio */}
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold text-navy dark:text-cream flex items-center gap-2">
            {profile.username}
            <Sparkles className="w-4 h-4 text-steel dark:text-sky" />
          </h1>
          {profile.designation && (
            <p className="text-sm font-medium text-navy/70 dark:text-cream/70">
              {profile.designation}
            </p>
          )}
          {profile.summary && (
            <p className="text-sm text-steel/70 dark:text-sky/50 leading-relaxed max-w-2xl">
              {profile.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
