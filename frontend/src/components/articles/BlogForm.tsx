// src/components/articles/BlogForm.tsx

'use client';

import React, { useState, FormEvent, useCallback, useEffect } from "react"; // <-- ADD useEffect
import { createBlogController } from "@/controllers/blog/createBlogController";
import { BlogRequest, MediaDetailsRequest, BlogDataResponse } from "@/lib/types/createBlog";
import { useAccessToken } from "@/hooks/useAccessToken"; 
import { cn } from "@/lib/utils"; 
import { Loader2, Zap } from "lucide-react"; 
import { TagsAndMediaSection } from "./form-components/TagsAndMediaSection"; 
import EnhancedBodyInput from "@/components/post/EnhancedBodyInput";
import TitleInput from "@/components/post/TitleInput"; 
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { LocationOption, CategorySummaryResponseDTO } from "@/lib/types/post"; 
import { LocationSearch } from "@/components/post/LocationSearch";
import CategoriesSelect from "@/components/post/CategoriesSelect";

type BlogFormState = BlogRequest; 

const initialState: BlogFormState = {
  title: "",
  body: "",
  summary: "",
  categoryIds: [],
  blogTagIds: [],
  locationId: undefined,
  mediaDetails: [],
};

const BlogForm: React.FC = () => {
  const [formData, setFormData] = useState<BlogFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [, setSubmittedData] = useState<BlogDataResponse | string | null>(null);
  
  const accessToken = useAccessToken(); 

  // <-- NEW LOCATION AND CATEGORY STATE -->
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>([]); // Use the expected type
  // <-- END NEW STATE -->

  // --- Core Handlers ---

  // Generic handler is simplified as location/categories are managed by dedicated components
  const handleEnhancedInputChange = useCallback((name: keyof BlogFormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handler for blogTagIds (only keeps this logic for TagsAndMediaSection)
  const handleArrayChange = useCallback((name: keyof BlogFormState, id: number) => {
    const currentArray = (formData[name] as number[] | undefined) || [];
    const newArray = currentArray.includes(id) 
      ? currentArray.filter(item => item !== id) 
      : [...currentArray, id];
    setFormData(prev => ({ ...prev, [name]: newArray }));
  }, [formData]);
  
  const mockAddMedia = useCallback(() => {
    const mockMedia: MediaDetailsRequest = {
      mediaId: Math.random() * 1000 | 0,
      url: `https://mock.com/image${Math.random() | 0}.jpg`,
      mediaType: "IMAGE",
      position: (formData.mediaDetails?.length || 0),
      width: 800,
      height: 600,
      fileSizeKb: 100,
      durationSeconds: null,
      extraMetadata: { key: "value" }
    };
    setFormData(prev => ({
      ...prev,
      mediaDetails: [...(prev.mediaDetails || []), mockMedia]
    }));
    setMessage(`Mock media added. Total: ${formData.mediaDetails?.length || 0 + 1}`);
  }, [formData.mediaDetails]);


  // <-- NEW EFFECT: Load categories on mount using the controller -->
  useEffect(() => {
    if (accessToken) {
      getParentCategoriesController(accessToken)
        .then((res) => {
          if (res.success && res.data?.content) {
             // FlatCategory[] is compatible with the expected structure for CategoriesSelect
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
    setError('');
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
    
    try {
      const payload: BlogRequest = {
        ...formData,
        categoryIds: formData.categoryIds, 
        blogTagIds: formData.blogTagIds,
        mediaDetails: formData.mediaDetails,
        // <-- USE selectedLocation.locationId for the API payload -->
        locationId: selectedLocation?.locationId 
      };
      
      const result = await createBlogController(payload, accessToken);

      if (result.success) {
        setMessage(result.message);
        setSubmittedData(result.data ?? null); 
        setFormData(initialState);
        setSelectedLocation(null); // Reset location state
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

      {/* --- 1. LOCATION SEARCH (REPLACEMENT for FormFieldHelper) --- */}
      <div className="mt-6">
        <LocationSearch
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation} // Only update location state
        />
        {/* The former FormFieldHelper for locationId is now implicitly handled by LocationSearch */}
      </div>
      {/* --- END LOCATION SEARCH --- */}
      
      {/* --- 2. CATEGORY SELECT (ADDITION) --- */}
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
      {/* --- END CATEGORY SELECT --- */}
      
      {/* --- TAGS & MEDIA (MODIFIED) --- */}
      <TagsAndMediaSection
        formData={formData}
        // Only keep handling for blogTagIds and mock media here
        onArrayChange={(name, id) => {
             if (name === 'blogTagIds') {
                handleArrayChange(name, id);
             }
        }}
        onMockMediaAdd={mockAddMedia}
      />
      
      {/* Feedback Messages... (omitted for brevity) */}
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

      {/* Submitted Data Preview... (omitted for brevity) */}

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