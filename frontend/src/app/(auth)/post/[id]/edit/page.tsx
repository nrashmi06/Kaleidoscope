"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAccessToken } from "@/hooks/useAccessToken";
import {
  PostCreateRequestDTO,
  LocationOption,
  CategorySummaryResponseDTO,
} from "@/lib/types/post";
import { updatePostController } from "@/controllers/postController/updatePost";
import { getPostByIdController } from "@/controllers/post/postController";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { getTaggableUsersController } from "@/controllers/userTagController/getTaggableUsersController";

import TitleInput from "@/components/post/TitleInput";
import EnhancedBodyInput from "@/components/post/EnhancedBodyInput";
import VisibilitySelect from "@/components/post/VisibilitySelect";
import { LocationSearch } from "@/components/post/LocationSearch";
import CategoriesSelect from "@/components/post/CategoriesSelect";
import MediaUpload from "@/components/post/MediaUpload";
import TagUsers from "@/components/post/TagUsers";
import { TaggableUser } from "@/lib/types/usertag";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const accessToken = useAccessToken();
  const postId = parseInt(params.id as string);

  const [formData, setFormData] = useState<PostCreateRequestDTO>({
    title: "",
    body: "",
    summary: "",
    visibility: "PUBLIC",
    locationId: null,
    categoryIds: [],
    mediaDetails: [],
    taggedUserIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>(
    []
  );
  const [users, setUsers] = useState<TaggableUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationOption | null>(null);

  // Load categories on mount
  useEffect(() => {
    if (accessToken) {
      getParentCategoriesController(accessToken)
        .then((res) => res.success && setCategories(res.data?.content ?? []))
        .catch(console.error);
    }
  }, [accessToken]);

  // Fetch existing post data
  useEffect(() => {
    if (!accessToken || isNaN(postId) || postId <= 0) return;

    const fetchPost = async () => {
      setFetching(true);
      try {
        const result = await getPostByIdController(postId, accessToken);
        if (result.success && result.data) {
          const post = result.data;
          setFormData({
            title: post.title,
            body: post.body,
            summary: post.summary,
            visibility: post.visibility,
            locationId: post.location?.locationId ?? null,
            categoryIds: post.categories.map((c) => c.categoryId),
            mediaDetails: post.media.map((m) => ({
              url: m.mediaUrl,
              mediaType: m.mediaType,
              position: m.position,
              width: m.width,
              height: m.height,
              fileSizeKb: m.fileSizeKb,
              durationSeconds: m.durationSeconds,
              extraMetadata: m.extraMetadata,
            })),
            taggedUserIds: post.taggedUsers.map((t) => t.taggedUserId),
          });

          if (post.location) {
            setSelectedLocation({
              id: `backend-${post.location.locationId}`,
              name: post.location.name,
              latitude: post.location.latitude,
              longitude: post.location.longitude,
              address: post.location.address,
              source: "backend",
              locationId: post.location.locationId,
            });
          }
        } else {
          toast.error(result.message || "Failed to load post");
          router.push("/feed");
        }
      } catch {
        toast.error("Failed to load post");
        router.push("/feed");
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [accessToken, postId, router]);

  // User search
  useEffect(() => {
    if (!userSearchQuery.trim() || !accessToken) {
      setUsers([]);
      return;
    }
    const timeout = setTimeout(() => {
      getTaggableUsersController(accessToken, userSearchQuery, 0, 20)
        .then((res) => {
          setUsers(res.data?.content || []);
        })
        .catch(() => setUsers([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (
      !formData.title.trim() ||
      !formData.body.trim() ||
      formData.categoryIds.length === 0
    ) {
      return toast.error("Title, body and categories are required");
    }
    if (formData.title.length > 200) {
      return toast.error("Title must be 200 characters or less");
    }
    if (formData.summary && formData.summary.length > 500) {
      return toast.error("Summary must be 500 characters or less");
    }
    if (formData.body.length > 50000) {
      return toast.error("Post body is too long (max 50,000 characters)");
    }

    setLoading(true);
    try {
      const updateResponse = await updatePostController(
        postId,
        formData,
        accessToken
      );
      if (!updateResponse.success)
        throw new Error(
          updateResponse.errors?.[0] || "Failed to update post"
        );

      toast.success("Post updated successfully!");
      router.push(`/post/${postId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update post"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-cream-50/50 dark:bg-navy-900/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-steel dark:text-sky" />
          <p className="text-sm text-steel dark:text-sky/60">
            Loading post...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50/50 dark:bg-navy-900/50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-surface-alt border border-border-default hover:bg-cream-300/30 dark:hover:bg-navy-600/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-steel dark:text-sky/70" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-heading">
              Edit Post
            </h1>
            <p className="text-steel/60 dark:text-sky/40">
              Update your post details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TitleInput
            value={formData.title}
            onChange={(title) => setFormData({ ...formData, title })}
          />
          <EnhancedBodyInput
            inputType="body"
            value={formData.body}
            onChange={(body: string) => setFormData({ ...formData, body })}
            accessToken={accessToken}
            placeholder="Write your post content here... Use # to add hashtags, **bold text**, *italic text*"
            minRows={8}
            maxRows={20}
            maxLength={50000}
          />
          <EnhancedBodyInput
            inputType="summary"
            value={formData.summary}
            onChange={(summary: string) =>
              setFormData({ ...formData, summary })
            }
            accessToken={accessToken}
            placeholder="A short summary for previews (max 500 characters)"
            minRows={4}
            maxRows={8}
            maxLength={500}
          />

          <VisibilitySelect
            value={formData.visibility}
            onChange={(visibility) => setFormData({ ...formData, visibility })}
          />

          <LocationSearch
            selectedLocation={selectedLocation}
            onLocationSelect={(loc) => {
              setSelectedLocation(loc);
              setFormData({
                ...formData,
                locationId: loc?.locationId || null,
              });
            }}
          />

          <CategoriesSelect
            categories={categories}
            selectedIds={formData.categoryIds}
            onToggle={(id) => {
              setFormData({
                ...formData,
                categoryIds: formData.categoryIds.includes(id)
                  ? formData.categoryIds.filter((c) => c !== id)
                  : [...formData.categoryIds, id],
              });
            }}
          />
          <MediaUpload
            accessToken={accessToken}
            formData={formData}
            setFormData={setFormData}
          />
          <TagUsers
            accessToken={accessToken}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            users={users}
            taggedUserIds={formData.taggedUserIds}
            onToggle={(id) =>
              setFormData({
                ...formData,
                taggedUserIds: formData.taggedUserIds?.includes(id)
                  ? formData.taggedUserIds.filter((u) => u !== id)
                  : [...(formData.taggedUserIds || []), id],
              })
            }
          />
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-full text-[15px] font-bold text-sub bg-surface-hover hover:bg-surface-hover active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 rounded-full text-[15px] font-bold text-on-primary bg-btn-primary hover:bg-btn-primary-hover active:scale-[0.98] shadow-md shadow-navy/15 dark:shadow-cream/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Updating..." : "Update Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
