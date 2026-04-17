
// src/components/articles/BlogForm.tsx

'use client';

import React, { useState, FormEvent, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBlogController } from "@/controllers/blog/createBlogController";
import { updateBlogController } from "@/controllers/blog/updateBlogController";
import { BlogRequest, BlogDataResponse } from "@/lib/types/createBlog";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Loader2, Link, Settings2 } from "lucide-react";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { LocationOption, CategorySummaryResponseDTO } from "@/lib/types/post";
import { LocationSearch } from "@/components/post/LocationSearch";
import CategoriesSelect from "@/components/post/CategoriesSelect";
import LinkedBlogSearch from "./LinkedBlogSearch";
import ArticleBlockEditor from "./form-components/ArticleBlockEditor";

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
  const [, setSubmittedData] = useState<BlogDataResponse | null>(null);
  const [hasUploadErrors, setHasUploadErrors] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const accessToken = useAccessToken();

  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [categories, setCategories] = useState<CategorySummaryResponseDTO[]>([]);

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

    if (hasUploadErrors) {
      setError("Some media files failed to upload. Please retry or remove them before submitting.");
      return;
    }

    const bodyTextOnly = formData.body.replace(/\{\{img:\d+\}\}/g, "").trim();

    if (!formData.title.trim() || !bodyTextOnly || formData.categoryIds.length === 0) {
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

    const reindexedMedia = (formData.mediaDetails ?? []).map((item, i) => ({
      ...item,
      position: i,
    }));

    const strictApiPayload: BlogRequest = {
        title: formData.title,
        body: formData.body,
        summary: formData.summary || undefined,
        mediaDetails: reindexedMedia.length > 0 ? reindexedMedia : undefined,
        locationId: selectedLocation?.locationId,
        categoryIds: formData.categoryIds,
        blogTagIds: formData.blogTagIds?.length ? formData.blogTagIds : undefined,
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
          setMessage(typeof result.message === "string" ? result.message : "Article created successfully!");
          setSubmittedData(result.data ?? null);
          setFormData(initialState);
          setSelectedLocation(null);

          setTimeout(() => {
              router.push("/articles");
          }, 1500);

        } else {
          setError(typeof result.message === "string" ? result.message : "Failed to create article.");
          setSubmittedData(result.data ?? null);
        }
      }

    } catch (error) {
      setError("An unexpected client-side error occurred: " + (error instanceof Error ? error.message : 'Unknown error'));

    } finally {
      setLoading(false);
    }
  };

  const bodyTextOnly = formData.body.replace(/\{\{img:\d+\}\}/g, "").trim();
  const isValid = formData.title.trim() && bodyTextOnly && formData.categoryIds.length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-0">
      {/* ── Title — Medium-style large input ── */}
      <div className="mb-6">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleEnhancedInputChange('title', e.target.value)}
          maxLength={200}
          placeholder="Title"
          className="w-full border-0 bg-transparent text-heading font-display text-3xl sm:text-[2.5rem] font-bold leading-tight placeholder:text-faint focus:ring-0 focus:outline-none py-2 tracking-tight"
          required
        />
        <div className="flex items-center justify-between mt-1">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[10px] text-faint ml-3">{formData.title.length}/200</span>
        </div>
      </div>

      {/* ── Block Editor — body + inline images ── */}
      <ArticleBlockEditor
        accessToken={accessToken}
        formData={formData}
        setFormData={setFormData}
        onUploadErrorChange={setHasUploadErrors}
      />

      {/* ── Summary ── */}
      <div className="mt-6">
        <textarea
          value={formData.summary ?? ""}
          onChange={(e) => handleEnhancedInputChange('summary', e.target.value)}
          placeholder="Add a summary..."
          maxLength={500}
          rows={2}
          className="w-full resize-none border-0 bg-transparent text-sub placeholder:text-faint focus:ring-0 focus:outline-none font-display text-base sm:text-lg leading-relaxed py-2"
        />
        {(formData.summary?.length ?? 0) > 0 && (
          <span className={`text-[10px] ${(formData.summary?.length ?? 0) > 425 ? "text-amber-500" : "text-faint"}`}>
            {formData.summary?.length ?? 0}/500
          </span>
        )}
      </div>

      {/* ── Thin separator ── */}
      <div className="h-px bg-border-subtle my-8" />

      {/* ── Categories ── */}
      <div className="mb-6">
        <p className="text-sm text-muted mb-3 font-display">
          Pick a category{formData.categoryIds.length === 0 && <span className="text-red-400 ml-1">*</span>}
        </p>
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

      {/* ── More Settings ── */}
      <button
        type="button"
        onClick={() => setSettingsOpen(v => !v)}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-heading transition-colors cursor-pointer font-display mb-6"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>{settingsOpen ? "Less" : "More"} options</span>
      </button>

      {settingsOpen && (
        <div className="space-y-6 mb-6">
          <div>
            <p className="text-sm text-muted mb-2 font-display flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" /> Link related articles
            </p>
            <LinkedBlogSearch
                onBlogSelect={handleLinkedBlogSelect}
                selectedBlogIds={formData.blogTagIds ?? []}
            />
          </div>

          <div>
            <p className="text-sm text-muted mb-2 font-display">Location</p>
            <LocationSearch
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-4">
            <p className="font-medium text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {message && (
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 mb-4">
            <p className="font-medium text-sm text-green-600 dark:text-green-400">{message}</p>
        </div>
      )}

      {/* ── Publish bar ── */}
      <div className="flex gap-3 pt-6 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 px-6 rounded-full text-sm font-semibold text-sub border border-border-default hover:bg-surface-hover active:scale-[0.98] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || hasUploadErrors || !isValid}
            className="flex-1 h-11 rounded-full text-sm font-bold text-on-primary bg-btn-primary hover:bg-btn-primary-hover active:scale-[0.98] shadow-md shadow-navy/15 dark:shadow-cream/10 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                <span>{isEditMode ? "Updating..." : "Publishing..."}</span>
              </div>
            ) : isEditMode ? 'Update Article' : 'Publish'}
          </button>
      </div>
    </form>
  );
};

export default BlogForm;
