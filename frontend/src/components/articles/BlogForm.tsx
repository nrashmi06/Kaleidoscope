'use client';

import React, { useState, FormEvent, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ Added useRouter
import { createBlogController } from "@/controllers/blog/createBlogController";
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
// ✅ Added BlogMediaUpload import
import BlogMediaUpload from "./form-components/BlogMediaUpload";
interface BlogFormLocalState extends BlogRequest {
    linkedBlogId?: number; 
    // linkedBlogTitle is purely for local UI display/reference
    linkedBlogTitle?: string; 
}

type BlogFormState = BlogFormLocalState; // Use the extended state type

const initialState: BlogFormState = {
  title: "",
  body: "",
  summary: "",
  categoryIds: [],
  blogTagIds: [],
  locationId: undefined,
  mediaDetails: [],
  linkedBlogId: undefined, 
  linkedBlogTitle: undefined, 
};

const BlogForm: React.FC = () => {
  const [formData, setFormData] = useState<BlogFormState>(initialState);
  const router = useRouter(); // ✅ Initialize router
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [, setSubmittedData] = useState<BlogDataResponse | string | null>(null);
  
  const accessToken = useAccessToken(); 

  // <-- NEW LOCATION AND CATEGORY STATE -->
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>([]);
  // <-- END NEW STATE -->

  // --- Core Handlers ---

  const handleEnhancedInputChange = useCallback((name: keyof BlogFormLocalState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Handler for setting the linked blog ID from the search component
  const handleLinkedBlogSelect = useCallback((blogId: number | undefined, title: string | undefined) => {
    setFormData(prev => ({
        ...prev,
        linkedBlogId: blogId,
        linkedBlogTitle: title,
    }));
  }, []);

  // <-- NEW EFFECT: Load categories on mount using the controller -->
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
  // <-- END NEW EFFECT -->


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
    
    setLoading(true);

    // ✅ PAYLOAD CONSTRUCTION: Extract the local-only fields (Linked Blog ID/Title)
    const { 
        linkedBlogId: ignoredLinkedBlogId, 
        ...apiPayload // This object now contains everything *except* linkedBlogId and linkedBlogTitle
    } = formData;
    
    // Ensure strict type match for API call
    const strictApiPayload: BlogRequest = {
        title: apiPayload.title,
        body: apiPayload.body,
        summary: apiPayload.summary,
        mediaDetails: apiPayload.mediaDetails,
        locationId: selectedLocation?.locationId,
        categoryIds: apiPayload.categoryIds,
        blogTagIds: apiPayload.blogTagIds,
    };
    
    if (ignoredLinkedBlogId !== undefined) {
        console.log(`[BlogForm] Note: Linked blog ID \${ignoredLinkedBlogId} captured but NOT sent in strict API body (BlogRequest).`);
    }

    try {
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
      
    } catch (error) {
      setError("An unexpected client-side error occurred: " + (error instanceof Error ? error.message : 'Unknown error'));

    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
        onSubmit={onSubmit} 
        className="max-w-4xl mx-auto p-6 md:p-8 rounded-xl bg-white dark:bg-neutral-900 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-colors"
    >
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        <Zap className="w-6 h-6 text-blue-600" /> New Article
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
        />
      </div>

      {/* ✅ LINKED BLOG SEARCH & SELECT (Uses filterBlogsController) */}
      <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Link className="w-4 h-4 text-blue-500" /> Select Related Blog (Optional)
        </label>
        <LinkedBlogSearch
            onBlogSelect={handleLinkedBlogSelect}
            selectedBlogId={formData.linkedBlogId}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Search for and select a related published blog post to tag it internally. 
            The ID captured is: <span className="font-medium text-gray-700 dark:text-gray-300">{formData.linkedBlogId || 'None'}</span>
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
      
      {/* --- 3. MEDIA UPLOAD (REPLACED) --- */}
      <section className="space-y-6 mt-6">
        <p className="font-bold mb-3 text-gray-800 dark:text-gray-300 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Media Details
        </p>
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800/50">
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
            "w-full px-6 py-3 font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-6",
            loading 
              ? "bg-gray-400 text-white cursor-not-allowed disabled:opacity-70" 
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin w-5 h-5 mr-2" />
            <span className="text-white">Creating...</span>
          </div>
        ) : 'Create Blog'}
      </button>
    </form>
  );
};

export default BlogForm;
