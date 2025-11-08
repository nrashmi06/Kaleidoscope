"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAccessToken } from "@/hooks/useAccessToken";
import { PostCreateRequestDTO, LocationOption, User, CategorySummaryResponseDTO } from "@/lib/types/post";
import { createPostController } from "@/controllers/postController/createPost";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { searchUsersController } from "@/controllers/userController/searchUsers";
import TitleInput from "@/components/post/TitleInput";
import BodyInput from "@/components/post/BodyInput";
import SummaryInput from "@/components/post/SummaryInput";
import VisibilitySelect from "@/components/post/VisibilitySelect";
import {LocationSearch} from "@/components/post/LocationSearch";
import CategoriesSelect from "@/components/post/CategoriesSelect";
import MediaUpload from "@/components/post/MediaUpload";
import TagUsers from "@/components/post/TagUsers";
import PostPreview from "@/components/post/PostPreview";
import Header from "@/components/post/Header";

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
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);

  // Load categories on mount
  useEffect(() => {
    if (accessToken) {
      getParentCategoriesController(accessToken)
        .then((res) => res.success && setCategories(res.data?.content ?? []))
        .catch(console.error);
    }
  }, [accessToken]);

  // Search users
  useEffect(() => {
    if (!userSearchQuery.trim() || !accessToken) return setUsers([]);
    const timeout = setTimeout(() => {
      searchUsersController(accessToken, userSearchQuery)
        .then((res) => setUsers(res.data?.content || []))
        .catch(() => setUsers([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!formData.title.trim() || !formData.body.trim() || formData.categoryIds.length === 0) {
      return toast.error("Title, body and categories are required");
    }

    setLoading(true);
    try {
      const createResponse = await createPostController(formData, accessToken);
      if (!createResponse.success) throw new Error(createResponse.errors?.[0] || "Failed to create post");

      toast.success("Post created successfully!");
      router.push("/feed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto p-6">
        <Header router={router} />
        <form onSubmit={handleSubmit} className="space-y-6">
          <TitleInput value={formData.title} onChange={(title) => setFormData({ ...formData, title })} />
          <BodyInput value={formData.body} onChange={(body: string) => setFormData({ ...formData, body })} accessToken={accessToken} />
          <SummaryInput value={formData.summary} onChange={(summary) => setFormData({ ...formData, summary })} />
          <VisibilitySelect value={formData.visibility} onChange={(visibility) => setFormData({ ...formData, visibility })} />
          
          {/* Updated: Using LocationSearch instead of LocationSelect */}
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
          <MediaUpload accessToken={accessToken} formData={formData} setFormData={setFormData} />
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
          <PostPreview formData={formData} mediaPreviewLength={formData.mediaDetails?.length || 0} selectedLocation={selectedLocation} />
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
