
// src/components/articles/BlogForm.tsx

'use client';

import React, { useState, FormEvent, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBlogController } from "@/controllers/blog/createBlogController";
import { updateBlogController } from "@/controllers/blog/updateBlogController";
import { BlogRequest, BlogDataResponse } from "@/lib/types/createBlog";
import { useAccessToken } from "@/hooks/useAccessToken"; 
import { cn } from "@/lib/utils"; 
import { Loader2, Zap, Link, Image as ImageIcon } from "lucide-react"; 
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
    <form 
        onSubmit={onSubmit}
        className="max-w-4xl mx-auto p-6 md:p-8 rounded-xl bg-cream-50 dark:bg-navy-800 shadow-lg border border-cream-300/40 dark:border-navy-700/40 transition-colors"
    >
      <h2 className="text-3xl font-display font-bold mb-6 text-navy dark:text-cream flex items-center gap-3">
        <Zap className="w-6 h-6 text-steel dark:text-sky" /> {isEditMode ? "Edit Article" : "New Article"}
      </h2>

      {/* --- TITLE --- */}
      <TitleInput
        value={formData.title}
        onChange={(value) => handleEnhancedInputChange('title', value)}
      />
      
      {/* --- BODY CONTENT --- */}
      <div className="mt-6">
        <EnhancedBodyInput
          inputType="body"
          value={formData.body}
          onChange={(value) => handleEnhancedInputChange('body', value)}
          accessToken={accessToken}
          placeholder="Write your article body content here... Use # to add hashtags, **bold text**, *italic text*"
          minRows={10}
          maxLength={50000}
        />
      </div>

      {/* --- SUMMARY --- */}
      <div className="mt-6">
        <EnhancedBodyInput
          inputType="summary"
          value={formData.summary}
          onChange={(value) => handleEnhancedInputChange('summary', value)}
          accessToken={accessToken}
          placeholder="A short summary for previews (max 500 characters)"
          minRows={4}
          maxLength={500}
        />
      </div>

      {/* ✅ LINKED BLOG SEARCH & SELECT (Passing the array of IDs) */}
      <div className="mt-6 p-6 bg-cream-50 dark:bg-navy-700/50 rounded-xl border border-cream-300/40 dark:border-navy-700/40 shadow-sm">
        <label className="block text-sm font-semibold text-navy dark:text-cream mb-2 flex items-center gap-2">
            <Link className="w-4 h-4 text-steel dark:text-sky" /> Link Related Blog(s) (Optional)
        </label>
        <LinkedBlogSearch
            onBlogSelect={handleLinkedBlogSelect}
            selectedBlogIds={formData.blogTagIds} // Pass the array
        />
        <p className="text-xs text-steel/50 dark:text-sky/40 mt-3">
            Search for and link related published blog posts.
            Total linked IDs: <span className="font-medium text-navy dark:text-cream">{formData.blogTagIds.length}</span>
        </p>
      </div>

      {/* --- 1. LOCATION SEARCH --- */}
      <div className="mt-6">
        <LocationSearch
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
        />
      </div>
      
      {/* --- 2. CATEGORY SELECT --- */}
      <div className="mt-6">
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
      </div>
      
      {/* --- 3. MEDIA UPLOAD --- */}
      <section className="space-y-6 mt-6">
        <p className="font-bold mb-3 text-navy dark:text-cream flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Media Details
        </p>
        <div className="p-6 rounded-xl border border-cream-300/40 dark:border-navy-700/40 bg-cream-50/60 dark:bg-navy-700/30">
          <BlogMediaUpload 
            accessToken={accessToken}
            formData={formData}
            setFormData={setFormData}
          />
        </div>
      </section>
      
      {/* Feedback Messages... */}
      {error && (
        <div className="mt-4 p-4 rounded-lg border border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            <p className="font-medium text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="mt-4 p-4 rounded-lg border border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-2">
            <span>✅</span>
            <p className="font-medium text-sm">{message}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
            "w-full px-6 py-3 font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 mt-6",
            loading
              ? "opacity-50 cursor-not-allowed bg-steel dark:bg-sky text-cream-50 dark:text-navy"
              : "bg-steel hover:bg-steel-600 dark:bg-sky dark:hover:bg-sky/80 text-cream-50 dark:text-navy shadow-steel/20 dark:shadow-sky/15"
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin w-5 h-5 mr-2" />
            <span>{isEditMode ? "Updating..." : "Creating..."}</span>
          </div>
        ) : isEditMode ? 'Update Article' : 'Create Blog'}
      </button>
    </form>
  );
};

export default BlogForm;