// src/app/(auth)/create-post/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAccessToken } from "@/hooks/useAccessToken";
import {
  PostCreateRequestDTO,
  LocationOption,
  CategorySummaryResponseDTO,
} from "@/lib/types/post";
import { createPostController } from "@/controllers/postController/createPost";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
// --- 1. IMPORT REPLACEMENT ---
import { getTaggableUsersController } from "@/controllers/userTagController/getTaggableUsersController";
// --- (Removed searchUsersController) ---

import TitleInput from "@/components/post/TitleInput";
import EnhancedBodyInput from "@/components/post/EnhancedBodyInput";
import VisibilitySelect from "@/components/post/VisibilitySelect";
import { LocationSearch } from "@/components/post/LocationSearch";
import CategoriesSelect from "@/components/post/CategoriesSelect";
import MediaUpload from "@/components/post/MediaUpload";
import TagUsers from "@/components/post/TagUsers";
import PostPreview from "@/components/post/PostPreview";
import Header from "@/components/post/Header";
import { TaggableUser } from "@/lib/types/usertag"; // <-- Import TaggableUser type

export default function CreatePostPage() {
  const router = useRouter();
  const accessToken = useAccessToken();

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
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>(
    []
  );
  // --- 2. UPDATE STATE TYPE ---
  // TaggableUser is compatible with User, but good to be specific
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

  // --- 3. UPDATE USER SEARCH LOGIC ---
  useEffect(() => {
    if (!userSearchQuery.trim() || !accessToken) {
      setUsers([]);
      return;
    }
    const timeout = setTimeout(() => {
      // Use getTaggableUsersController
      getTaggableUsersController(accessToken, userSearchQuery, 0, 20)
        .then((res) => {
          // The response structure (res.data.content) is the same
          setUsers(res.data?.content || []);
        })
        .catch(() => setUsers([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, accessToken]);
  // --- END OF CHANGES ---

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

    setLoading(true);
    try {
      const createResponse = await createPostController(formData, accessToken);
      if (!createResponse.success)
        throw new Error(createResponse.errors?.[0] || "Failed to create post");

      toast.success("Post created successfully!");
      router.push("/feed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create post"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto p-6">
        <Header router={router} />
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
          />
          <EnhancedBodyInput
            inputType="summary"
            value={formData.summary}
            onChange={(summary: string) => setFormData({ ...formData, summary })}
            accessToken={accessToken}
            placeholder="A short summary for previews (max 500 characters)"
            minRows={4}
            maxRows={8}
          />

          <VisibilitySelect
            value={formData.visibility}
            onChange={(visibility) => setFormData({ ...formData, visibility })}
          />

          <LocationSearch
            selectedLocation={selectedLocation}
            onLocationSelect={(loc) => {
              setSelectedLocation(loc);
              setFormData({ ...formData, locationId: loc?.locationId || null });
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
            users={users} // This prop is compatible with TaggableUser[]
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
          <PostPreview
            formData={formData}
            mediaPreviewLength={formData.mediaDetails?.length || 0}
            selectedLocation={selectedLocation}
          />
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}