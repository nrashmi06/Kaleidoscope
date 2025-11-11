// src/components/user/UserProfile.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getUserProfileController } from "@/controllers/userController/getUserProfileController";
import { MappedUserProfile, FollowStatus } from "@/lib/types/userProfile";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import {
  Users,
  UserPlus,
  Lock,
  RefreshCw,
  X,
  Eye,
  Sparkles,
  FileText,
  UserX,
  ShieldAlert,
  Loader2, // ✅ 1. Import Loader2
} from "lucide-react";
import FollowButton from "@/components/common/FollowButton";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import PostLoader from "@/components/loading/PostLoader";
import { Post as PostType } from "@/services/post/fetchPosts";
import { BlockUserModal } from "@/components/user-blocks/BlockUserModal";
import { userBlockStatusController } from "@/controllers/user-blocks/userBlockStatusController";
import type { UserBlockStatusData } from "@/lib/types/userBlockStatus";
import { toast } from "react-hot-toast";
import { unblockUserController } from "@/controllers/user-blocks/unblockUserController"; // ✅ 2. Import unblock controller
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal"; // ✅ 3. Import confirmation modal

interface UserProfileProps {
  userId: number;
}

const FollowStatusPill: React.FC<{ status: FollowStatus; isPrivate: boolean }> = ({
  status,
  isPrivate,
}) => {
  // ... (component code is unchanged)
  if (isPrivate && status === "NOT_FOLLOWING") {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 flex items-center gap-1">
        <Lock className="w-3 h-3" /> Private
      </span>
    );
  }
  switch (status) {
    case "FOLLOWING":
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          Following
        </span>
      );
    case "PENDING":
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
          Requested
        </span>
      );
    default:
      return null;
  }
};

/**
 * Renders a full user profile page using a clean, minimalist layout.
 */
export function UserProfile({ userId }: UserProfileProps) {
  const [profile, setProfile] = useState<MappedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockStatus, setBlockStatus] = useState<UserBlockStatusData | null>(
    null
  );
  const accessToken = useAccessToken();
  const currentUser = useUserData();
  const router = useRouter();

  // ✅ 4. Add state for unblock modal and loading
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const isOwner = currentUser?.userId === userId;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setBlockStatus(null); 

    try {
      // Fetch main profile
      const result = await getUserProfileController(userId, accessToken);

      if (result.success && result.data) {
        setProfile(result.data);

        // After setting profile, check if we need to fetch block status
        const isProfileOwner = currentUser?.userId === result.data.userId;

        if (!isProfileOwner && accessToken) {
          const statusResult = await userBlockStatusController(
            { targetUserId: result.data.userId },
            accessToken
          );

          if (statusResult.success && statusResult.data) {
            setBlockStatus(statusResult.data);
          } else {
            // Don't fail the whole page, just log an error
            console.error("Failed to fetch block status:", statusResult.message);
          }
        }
      } else {
        setError(result.message || "Failed to load profile.");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, currentUser?.userId]);

  useEffect(() => {
    if (userId > 0) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  const handlePostDeleted = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditProfile = () => {
    router.push("/settings/profile-edit");
  };

  const handleBlockSuccess = () => {
    setIsBlockModalOpen(false); // Close the modal
    fetchProfile(); // Refetch profile data to update block status
  };

  // ✅ 5. Add handler for unblock confirmation
  const handleConfirmUnblock = async () => {
    if (!profile || !accessToken) return;

    setIsUnblocking(true);
    const toastId = toast.loading("Unblocking user...");

    const result = await unblockUserController(
      { userIdToUnblock: profile.userId },
      accessToken
    );

    if (result.success) {
      toast.success(result.message, { id: toastId });
      setIsUnblockModalOpen(false);
      fetchProfile(); // Refetch profile to show new button states
    } else {
      toast.error(result.message, { id: toastId });
    }

    setIsUnblocking(false);
  };

  // --- Loading State (Minimalist Skeleton) ---
  if (loading) {
    // ... (skeleton code is unchanged)
    return (
      <div className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-0 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-neutral-800 w-full"></div>
        <div className="px-8 pb-6">
          <div className="w-32 h-32 -mt-16 rounded-full bg-gray-300 dark:bg-neutral-700 border-4 border-white dark:border-neutral-900 shadow-md"></div>
          <div className="pt-4 space-y-3">
            <div className="h-8 w-4/5 bg-gray-300 dark:bg-neutral-700 rounded-md"></div>
            <div className="h-5 w-3/5 bg-gray-200 dark:bg-neutral-700 rounded-md"></div>
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-neutral-700 rounded-md"></div>
            <div className="flex space-x-3 pt-4">
              <div className="h-9 w-24 bg-blue-500 rounded-full"></div>
              <div className="h-9 w-24 bg-gray-200 dark:bg-neutral-700 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="px-6 pt-6 border-t border-gray-100 dark:border-neutral-800 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-neutral-700 rounded"></div>
          <PostLoader />
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    // ... (error code is unchanged)
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-red-200 dark:border-red-900/50">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Error
        </h3>
        <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center gap-2 mx-auto hover:bg-blue-700 transition-all duration-300 shadow-md font-semibold"
        >
          <RefreshCw className="w-5 h-5" /> Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const mappedPosts: PostType[] = profile.posts.content.map((p) => ({
    // ... (mapping logic is unchanged)
    ...p,
    mediaDetails: p.thumbnailUrl
      ? [
          {
            url: p.thumbnailUrl,
            mediaType: "IMAGE",
            position: 0,
            width: 0,
            height: 0,
            fileSizeKb: 0,
          },
        ]
      : undefined,
    commentCount: p.commentCount,
    reactionCount: p.reactionCount,
    summary: p.summary,
    visibility:
      (p.visibility as "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE") ?? "PUBLIC",
    createdAt: p.createdAt,
    body: "",
    thumbnailUrl: p.thumbnailUrl,
  })) as PostType[];

  const isPostsPrivate =
    profile.isPrivate &&
    profile.followStatus !== "FOLLOWING" &&
    !isOwner &&
    profile.followStatus !== "PENDING";

  return (
    <>
      {" "}
      {/* Fragment */}
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {/* --- Header/Cover Photo Section --- */}
        <div className="relative">
          {/* ... (Cover Photo markup is unchanged) ... */}
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

              {/* ✅ --- 6. UPDATED ACTION BUTTONS LOGIC --- */}
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
                    You are blocked by this user
                  </div>
                ) : blockStatus?.isBlocked ? (
                  // Case 2: You have blocked this user (NOW FUNCTIONAL)
                  <button
                    onClick={() => setIsUnblockModalOpen(true)} // ✅ Set modal state
                    disabled={isUnblocking} // ✅ Disable while loading
                    className="px-4 py-2.5 text-sm font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 inline-flex items-center gap-2 transition-all duration-200 border border-yellow-300 dark:border-yellow-700 disabled:opacity-50"
                    title="Unblock this user"
                  >
                    {isUnblocking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserX className="w-4 h-4" />
                    )}
                    {isUnblocking ? "Unblocking..." : "Unblock"}
                  </button>
                ) : (
                  // Case 3: No block, show normal buttons
                  <>
                    <FollowButton targetUserId={userId} />
                    <button
                      onClick={() => setIsBlockModalOpen(true)}
                      className="p-2 text-xs font-semibold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 inline-flex items-center gap-2 transition-all duration-200 border border-red-200 dark:border-red-700"
                      title="Block this user"
                    >
                      <UserX className="w-3 h-3" /> Block
                    </button>
                  </>
                )}
              </div>
              {/* ✅ --- END OF UPDATED LOGIC --- */}
            </div>

            {/* ... (Text Details and Stats Row are unchanged) ... */}
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
            
            <div className="flex items-center gap-4 pt-4 text-sm text-gray-600 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile.followerCount}
                </span>
                <span>Followers</span>
              </div>
              <span className="text-gray-300 dark:text-neutral-700">•</span>
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cyan-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile.followingCount}
                </span>
                <span>Following</span>
              </div>
              <span className="text-gray-300 dark:text-neutral-700">•</span>
              <FollowStatusPill
                status={profile.followStatus}
                isPrivate={profile.isPrivate}
              />
            </div>

          </div>
        </div>

        {/* --- Posts Section --- */}
        <div className="p-6 border-t border-gray-200 dark:border-neutral-800">
          {/* ... (Posts header is unchanged) ... */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Posts
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
                {profile.posts.totalElements}
              </span>
            </h2>
          </div>

          {/* ... (Posts content logic is unchanged) ... */}
          {isPostsPrivate ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 shadow-inner">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                <Lock className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Private Profile
              </h3>
              <p className="text-gray-600 dark:text-neutral-400">
                {profile.followStatus === "PENDING"
                  ? "Your follow request is pending approval."
                  : "Follow this user to see their posts."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {mappedPosts.length > 0 ? (
                mappedPosts.map((post) => (
                  <SocialPostCard
                    key={post.postId}
                    post={post}
                    accessToken={accessToken!}
                    onPostDeleted={handlePostDeleted}
                  />
                ))
              ) : (
                <div className="text-center py-16 text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700">
                  <Eye className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    This user hasn&apos;t posted anything yet.
                  </p>
                </div>
              )}
              
              {profile.posts.totalPages > 1 &&
                profile.posts.page < profile.posts.totalPages - 1 && (
                  <div className="text-center pt-6">
                    <button className="px-6 py-2.5 text-sm font-semibold rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all duration-200 shadow-md">
                      Load More Posts
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* --- RENDER MODALS --- */}
      {/* ✅ 7. Render Block Modal */}
      {isBlockModalOpen && profile && (
        <BlockUserModal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          targetUser={{ userId: profile.userId, username: profile.username }}
          onBlockSuccess={handleBlockSuccess}
        />
      )}

      {/* ✅ 8. Render Unblock Confirmation Modal */}
      {isUnblockModalOpen && profile && (
        <DeleteConfirmationModal
          isOpen={isUnblockModalOpen}
          onCancel={() => setIsUnblockModalOpen(false)}
          onConfirm={handleConfirmUnblock}
          isDeleting={isUnblocking}
          title="Unblock User"
          message={`Are you sure you want to unblock @${profile.username}? They will be able to see your posts and interact with you again.`}
        />
      )}
    </>
  );
}