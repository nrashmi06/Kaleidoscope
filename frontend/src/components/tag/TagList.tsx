"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getTagsByContentController,
  isTagError,
  getTagErrorMessage,
  isAuthTagError
} from "@/controllers/tag/tagController";
import { ContentType } from "@/lib/types/tag";
import { MappedTag, MappedPaginatedTagResponse } from "@/lib/types/tag";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Clock
} from "lucide-react";

interface TagListProps {
  contentType: ContentType;
  contentId: number;
  accessToken?: string;
  currentUserId?: number;
  pageSize?: number;
  className?: string;
  showPagination?: boolean;
  onAuthError?: () => void;
}

export function TagList({
  contentType,
  contentId,
  accessToken,
  currentUserId,
  pageSize = 10,
  className = "",
  showPagination = true,
  onAuthError
}: TagListProps) {
  const [tags, setTags] = useState<MappedTag[]>([]);
  const [pagination, setPagination] = useState<MappedPaginatedTagResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [, setRetryCount] = useState(0);

  const fetchTags = async (page: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTagsByContentController({
        contentType,
        contentId,
        queryParams: {
          page,
          size: pageSize,
          sort: ['createdAt,desc']
        }
      }, accessToken, currentUserId);

      if (isTagError(result)) {
        const errorMessage = getTagErrorMessage(result);
        setError(errorMessage);

        if (isAuthTagError(result)) {
          onAuthError?.();
        }
      } else {
        setTags(result.data?.tags || []);
        setPagination(result.data?.pagination || null);
        setCurrentPage(page);
        setRetryCount(0);
      }
    } catch (err) {
      console.error('Unexpected error in TagList:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contentId > 0) {
      fetchTags(0);
    }
  }, [contentType, contentId, accessToken, pageSize]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchTags(currentPage);
  };

  const handleNextPage = () => {
    if (pagination?.hasNext) {
      fetchTags(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination?.hasPrevious) {
      fetchTags(currentPage - 1);
    }
  };

  const handlePageClick = (page: number) => {
    fetchTags(page);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 text-steel/70 dark:text-sky/50">
          <Users className="w-5 h-5" />
          <h3 className="font-semibold">Tagged Users</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                <div className="w-8 h-8 bg-cream-300/60 dark:bg-navy-700/60 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-cream-300/60 dark:bg-navy-700/60 rounded w-24"></div>
                  <div className="h-3 bg-surface-hover rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 text-steel/70 dark:text-sky/50">
          <Users className="w-5 h-5" />
          <h3 className="font-semibold">Tagged Users</h3>
        </div>
        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-900/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Failed to Load Tags
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (tags.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 text-steel/70 dark:text-sky/50">
          <Users className="w-5 h-5" />
          <h3 className="font-semibold">Tagged Users</h3>
        </div>
        <div className="p-6 text-center bg-cream-50/50 dark:bg-navy-700/30 rounded-xl border border-dashed border-cream-300 dark:border-navy-700">
          <Users className="w-12 h-12 text-steel/40 dark:text-sky/30 mx-auto mb-3" />
          <h4 className="font-medium text-heading mb-1">
            No Tags Found
          </h4>
          <p className="text-sm text-steel/60 dark:text-sky/40">
            No users have been tagged in this {contentType.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-steel/70 dark:text-sky/50">
          <Users className="w-5 h-5" />
          <h3 className="font-semibold">Tagged Users</h3>
          <span className="text-sm text-steel/50 dark:text-sky/30">
            ({pagination?.totalElements || tags.length})
          </span>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="text-xs text-steel/50 dark:text-sky/30">
            Page {pagination.page + 1} of {pagination.totalPages}
          </div>
        )}
      </div>

      {/* Tags List */}
      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag.tagId}
            className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border-default hover:bg-cream-300/20 dark:hover:bg-navy-700/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky rounded-full flex items-center justify-center text-sm font-medium">
                  {tag.taggedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/profile/${tag.taggedUser.userId}`}
                      className="font-medium text-heading text-sm hover:underline hover:text-steel dark:hover:text-sky"
                    >
                      @{tag.taggedUser.username}
                    </Link>
                    {tag.isCurrentUser && (
                      <span title="This is you">
                        <UserCheck className="w-3 h-3 text-green-500" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-steel/50 dark:text-sky/30">
                    Tagged by @{tag.taggerUser.username}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-steel/50 dark:text-sky/30">
              <Clock className="w-3 h-3" />
              <span>{tag.formattedCreatedAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border-default">
          <div className="text-sm text-steel/60 dark:text-sky/40">
            Showing {tags.length} of {pagination.totalElements} tags
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={!pagination.hasPrevious || loading}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-steel dark:text-sky/70 hover:text-navy dark:hover:text-cream disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(
                  0,
                  Math.min(
                    pagination.totalPages - 5,
                    pagination.page - 2
                  )
                ) + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    disabled={loading}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      pageNum === pagination.page
                        ? 'bg-steel text-cream-50 dark:bg-sky dark:text-navy'
                        : 'text-steel/60 dark:text-sky/40 hover:text-navy dark:hover:text-cream hover:bg-surface-hover'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNext || loading}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-steel dark:text-sky/70 hover:text-navy dark:hover:text-cream disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
