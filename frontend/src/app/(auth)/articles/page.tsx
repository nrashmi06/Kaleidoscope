// src/app/(auth)/articles/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Button } from "@/components/ui/button"; 
import { useRouter } from "next/navigation";
import { PencilLine, Search, ChevronLeft, ChevronRight, AlertCircle, Inbox, RefreshCw } from "lucide-react"; 
import { Input } from "@/components/ui/input";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import type { BlogItem, PaginationMeta } from "@/lib/types/blogFilter.types";

// Define the default filter and pagination state
const ARTICLES_PER_PAGE = 9; // Show 9 articles
const defaultPagination: PaginationMeta = { page: 0, size: ARTICLES_PER_PAGE, totalPages: 0, totalElements: 0, first: true, last: true };

export default function ArticlesPage() {
  const router = useRouter();
  const accessToken = useAccessToken();

  // State for data and UI control
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(defaultPagination);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 400);
  
  // State for page number, controlled by pagination clicks
  const [currentPage, setCurrentPage] = useState(0);

  const handleCreateArticle = () => {
    router.push("/articles/create");
  };

  const fetchBlogs = useCallback(async (page: number, searchQuery: string) => {
    if (!accessToken) {
        setLoading(false);
        setError("Authentication required.");
        return;
    }
    
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);

    // Construct the filter request payload
    const filters = {
        page: page,
        size: ARTICLES_PER_PAGE,
        // Only pass 'q' if the search query is non-empty
        ...(searchQuery.trim() && { q: searchQuery.trim() }), 
        // Default sort is handled by the controller (createdAt,desc), 
        // fulfilling the requirement "if no search param is given DONT PASS ANY FILTER LET IS JUST DISPAY BASED ON DESC ORDER"
    };

    try {
        const result = await filterBlogsController(accessToken, filters);

        if (result.success) {
            setBlogs(result.blogs);
            setPagination(result.pagination);
        } else {
            setError(result.error || "Failed to load articles.");
            setBlogs([]);
            setPagination(defaultPagination);
        }
    } catch (err) {
        setError("An unexpected error occurred while fetching articles." + (err instanceof Error ? ` (${err.message})` : ""));
        setBlogs([]);
        setPagination(defaultPagination);
    } finally {
        setLoading(false);
    }
  }, [accessToken]);


  // Effect 1: Trigger fetch on debounced query change, and page change
  useEffect(() => {
    fetchBlogs(currentPage, debouncedQuery);
  }, [debouncedQuery, currentPage, fetchBlogs]);

  // Effect 2: When the query changes (search begins), reset page to 0.
  useEffect(() => {
    // Only reset if the debounced query has changed
    if (currentPage !== 0 && debouncedQuery.trim() === query.trim()) {
        setCurrentPage(0);
    } 
  }, [debouncedQuery]);
  

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
        setCurrentPage(newPage);
    }
  };
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Reset to first page whenever the query changes
    if (currentPage !== 0) {
        setCurrentPage(0); 
    }
  };
  
  const handleRetry = () => {
    fetchBlogs(currentPage, debouncedQuery);
  };
  
  // --- Render Content Logic ---

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 px-2 sm:px-4">
          {[...Array(ARTICLES_PER_PAGE)].map((_, index) => (
            <div key={index} className="w-86 h-[30rem] rounded-3xl bg-gray-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      );
    }

    if (error) {
        return (
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center py-16 px-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
                  Failed to Load Articles
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-6 max-w-sm">{error}</p>
              <Button onClick={handleRetry} variant="destructive">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
          </div>
        );
    }

    if (blogs.length === 0) {
        return (
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center py-16 px-6 bg-gray-50 dark:bg-neutral-800/50 border border-dashed border-gray-200 dark:border-neutral-700 rounded-xl">
              <Inbox className="w-12 h-12 text-gray-400 dark:text-neutral-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                  No Articles Found
              </h3>
              <p className="text-gray-500 dark:text-neutral-400">
                  {debouncedQuery.trim() ? `No articles matching "${debouncedQuery}" were found.` : 'There are no articles to display yet.'}
              </p>
          </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 px-2 sm:px-4">
            {blogs.map((blog) => (
              <div key={blog.blogId} className="flex justify-center">
                <ArticleCard
                    title={blog.title.toUpperCase()}
                    views={blog.viewCount}
                    blogId={blog.blogId}
                    onClick={() => router.push(`/articles/${blog.blogId}`)}
                />
              </div>
            ))}
        </div>
    );
  };
  
  // --- Main Component Render ---
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 py-10 px-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-10 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
              Explore Featured Articles
            </h1>
            <p className="text-gray-600 dark:text-neutral-400 text-lg max-w-2xl">
              Discover insightful reads on cutting-edge technology and more.
            </p>
          </div>
          
          <Button
            onClick={handleCreateArticle}
            className="mt-6 sm:mt-0 px-6 py-3 shadow-lg hover:shadow-xl"
          >
            <PencilLine className="w-5 h-5 mr-2" />
            Create Article
          </Button>
        </div>
        
        {/* --- NEW SEARCH BAR --- */}
        <div className="relative max-w-lg mx-auto sm:mx-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500" />
          <Input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search articles by title..."
            className="pl-10 pr-4 py-3 h-auto"
            disabled={loading}
          />
        </div>
      </div>

      {/* Articles Grid */}
      {renderContent()}
      
      {/* --- NEW PAGINATION CONTROLS --- */}
      {!loading && blogs.length > 0 && pagination.totalPages > 1 && (
        <div className="max-w-7xl mx-auto flex items-center justify-between mt-10 p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-md">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={pagination.first || loading}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
              Page {currentPage + 1} of {pagination.totalPages}
            </span>
            <span className="text-sm text-gray-500 dark:text-neutral-400">
              Showing {pagination.totalElements} results
            </span>
          </div>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={pagination.last || loading}
            variant="outline"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}