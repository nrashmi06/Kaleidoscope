
// src/components/articles/BlogForm.tsx

'use client';

import React, { useState, FormEvent, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBlogController } from "@/controllers/blog/createBlogController";
import { updateBlogController } from "@/controllers/blog/updateBlogController";
import { BlogRequest, BlogDataResponse } from "@/lib/types/createBlog";
import { useAccessToken } from "@/hooks/useAccessToken"; 
import { Loader2, Link, Image as ImageIcon } from "lucide-react";
import EnhancedBodyInput from "@/components/post/EnhancedBodyInput";
import TitleInput from "@/components/post/TitleInput"; 
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { LocationOption, CategorySummaryResponseDTO } from "@/lib/types/post"; 
import { LocationSearch } from "@/components/post/LocationSearch";
import CategoriesSelect from "@/components/post/CategoriesSelect";
import LinkedBlogSearch from "./LinkedBlogSearch";
import BlogMediaUpload from "./form-components/BlogMediaUpload";

// ✅ REMOVED: interface BlogFormLocalState
type BlogFormState = BlogRequest; // Use BlogRequest directly

const initialState: BlogFormState = {
  title: "",
  body: "",
  summary: "",
  categoryIds: [],
  blogTagIds: [], 
  locationId: undefined,
  mediaDetails: [],
  // ✅ REMOVED: linkedBlogTitle: undefined, 
};

interface BlogFormProps {
  editBlogId?: number;
  initialData?: BlogRequest;
}

const BlogForm: React.FC<BlogFormProps> = ({ editBlogId, initialData }) => {
  const isEditMode = !!editBlogId && !!initialData;
  const router = useRouter();
  const [formData, setFormData] = useState<BlogFormState>(initialData ?? initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [, setSubmittedData] = useState<BlogDataResponse | string | null>(null);
  
  const accessToken = useAccessToken(); 

  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>([]);

  // ✅ UPDATED: Used keyof BlogRequest
  const handleEnhancedInputChange = useCallback((name: keyof BlogRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  const handleLinkedBlogSelect = useCallback((linkedBlogIds: number[]) => {
    setFormData(prev => ({
        ...prev,
        blogTagIds: linkedBlogIds,
    }));
  }, []);

  useEffect(() => {
    if (accessToken) {
      getParentCategoriesController(accessToken)
        .then((res) => {
          if (res.success && res.data?.content) {
            setCategories(res.data.content as CategorySummaryResponseDTO[]); 
          }
        })
        .catch(console.error);
    }
  }, [accessToken]);


  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError(null); 
    setSubmittedData(null); 
    
    if (!accessToken) {
        setError("User not authenticated. Please log in.");
        return;
    }
    if (!formData.title.trim() || !formData.body.trim() || formData.categoryIds.length === 0) {
      setError("Title, body, and at least one category are required.");
      return;
    }
    if (formData.title.length > 200) {
      setError("Title must be 200 characters or less.");
      return;
    }
    if (formData.summary && formData.summary.length > 500) {
      setError("Summary must be 500 characters or less.");
      return;
    }
    if (formData.body.length > 50000) {
      setError("Article body is too long (max 50,000 characters).");
      return;
    }
    
    setLoading(true);

    // ✅ REMOVED DESTRUCTURING: formData now strictly matches BlogRequest
    const apiPayload = formData; 
    
    const strictApiPayload: BlogRequest = {
        title: apiPayload.title,
        body: apiPayload.body,
        summary: apiPayload.summary,
        mediaDetails: apiPayload.mediaDetails,
        locationId: selectedLocation?.locationId,
        categoryIds: apiPayload.categoryIds,
        blogTagIds: apiPayload.blogTagIds, 
    };
    
    try {
      if (isEditMode && editBlogId) {
        const result = await updateBlogController(accessToken, editBlogId, strictApiPayload);

        if (result.success) {
          setMessage(result.message || "Article updated successfully!");
          setTimeout(() => {
            router.push(`/articles/${editBlogId}`);
          }, 1500);
        } else {
          setError(result.message || "Failed to update article.");
        }
      } else {
        const result = await createBlogController(strictApiPayload, accessToken);

        if (result.success) {
          setMessage(result.message);
          setSubmittedData(result.data ?? null);
          setFormData(initialState);
          setSelectedLocation(null);

          setTimeout(() => {
              router.push("/articles");
          }, 1500);

        } else {
          setError(result.message);
          setSubmittedData(result.data ?? null);
        }
      }

    } catch (error) {
      setError("An unexpected client-side error occurred: " + (error instanceof Error ? error.message : 'Unknown error'));

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* --- TITLE --- */}
      <TitleInput
        value={formData.title}
        onChange={(value) => handleEnhancedInputChange('title', value)}
      />

      {/* --- BODY CONTENT --- */}
      <EnhancedBodyInput
        inputType="body"
        value={formData.body}
        onChange={(value) => handleEnhancedInputChange('body', value)}
        accessToken={accessToken}
        placeholder="Write your article body content here... Use # to add hashtags, **bold text**, *italic text*"
        minRows={10}
        maxLength={50000}
      />

      {/* --- SUMMARY --- */}
      <EnhancedBodyInput
        inputType="summary"
        value={formData.summary}
        onChange={(value) => handleEnhancedInputChange('summary', value)}
        accessToken={accessToken}
        placeholder="A short summary for previews (max 500 characters)"
        minRows={4}
        maxLength={500}
      />

      {/* LINKED BLOG SEARCH & SELECT */}
      <div className="p-6 bg-cream-50 dark:bg-navy-700/50 rounded-xl border border-cream-300/40 dark:border-navy-700/40 shadow-sm">
        <label className="block text-sm font-semibold text-navy dark:text-cream mb-2 flex items-center gap-2">
            <Link className="w-4 h-4 text-navy/50 dark:text-cream/50" /> Link Related Article(s) (Optional)
        </label>
        <LinkedBlogSearch
            onBlogSelect={handleLinkedBlogSelect}
            selectedBlogIds={formData.blogTagIds}
        />
        <p className="text-xs text-navy/40 dark:text-cream/35 mt-3">
            Search for and link related published articles.
            Total linked: <span className="font-medium text-navy dark:text-cream">{formData.blogTagIds.length}</span>
        </p>
      </div>

      {/* --- LOCATION SEARCH --- */}
      <LocationSearch
        selectedLocation={selectedLocation}
        onLocationSelect={setSelectedLocation}
      />

      {/* --- CATEGORY SELECT --- */}
      <CategoriesSelect
        categories={categories}
        selectedIds={formData.categoryIds}
        onToggle={(id) =>
          setFormData(prev => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(id)
              ? prev.categoryIds.filter((c) => c !== id)
              : [...prev.categoryIds, id],
          }))
        }
      />

      {/* --- MEDIA UPLOAD --- */}
      <div className="p-6 rounded-xl border border-cream-300/40 dark:border-navy-700/40 bg-cream-50 dark:bg-navy-700/50 shadow-sm">
        <p className="font-bold mb-4 text-navy dark:text-cream flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Media Details
        </p>
        <BlogMediaUpload
          accessToken={accessToken}
          formData={formData}
          setFormData={setFormData}
        />
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-2xl border border-red-200/60 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-2">
            <p className="font-medium text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="p-4 rounded-2xl border border-green-200/60 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 flex items-center gap-2">
            <p className="font-medium text-sm">{message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 h-12 rounded-full text-[15px] font-bold text-navy/70 dark:text-cream/60 bg-cream-300/40 dark:bg-navy-700/40 hover:bg-cream-300/60 dark:hover:bg-navy-700/60 active:scale-[0.98] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] h-12 rounded-full text-[15px] font-bold text-cream-50 dark:text-navy bg-navy dark:bg-cream hover:bg-navy/90 dark:hover:bg-cream/90 active:scale-[0.98] shadow-md shadow-navy/15 dark:shadow-cream/10 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              <span>{isEditMode ? "Updating..." : "Creating..."}</span>
            </div>
          ) : isEditMode ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  );
};

export default BlogForm;