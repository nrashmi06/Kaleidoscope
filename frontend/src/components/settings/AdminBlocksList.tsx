"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAllBlockedUsersAdminController } from "@/controllers/admin/getAllBlockedUsersAdminController";
import { removeBlockByIdAdminController } from "@/controllers/admin/removeBlockByIdAdminController";
import { useAccessToken } from "@/hooks/useAccessToken";
import type { AdminBlockEntry } from "@/services/admin/getAllBlockedUsersAdmin";
import { toast } from "react-hot-toast";
import {
  ShieldBan,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  ArrowRight,
} from "lucide-react";

const BlockCardSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface border border-border-default animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="h-4 w-24 rounded bg-cream-300/50 dark:bg-navy-600/50" />
        <div className="h-4 w-4 rounded bg-cream-300/40 dark:bg-navy-600/40" />
        <div className="h-4 w-24 rounded bg-cream-300/50 dark:bg-navy-600/50" />
      </div>
      <div className="h-8 w-28 rounded-lg bg-cream-300/50 dark:bg-navy-600/50" />
    </div>
    <div className="mt-2 space-y-1.5">
      <div className="h-3 w-48 rounded bg-cream-300/40 dark:bg-navy-600/40" />
      <div className="h-3 w-32 rounded bg-cream-300/30 dark:bg-navy-600/30" />
    </div>
  </div>
);

export const AdminBlocksList: React.FC = () => {
  const [blocks, setBlocks] = useState<AdminBlockEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const accessToken = useAccessToken();

  const fetchPage = useCallback(
    async (page: number) => {
      if (!accessToken) {
        setIsLoading(false);
        setError("Not authenticated.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getAllBlockedUsersAdminController(
          accessToken,
          page,
          20
        );

        if (result.success && result.data) {
          setBlocks(result.data.content);
          setCurrentPage(result.data.currentPage);
          setTotalPages(result.data.totalPages);
          setTotalElements(result.data.totalElements);
        } else {
          throw new Error(result.message || "Failed to load blocks.");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const handleRemoveBlock = useCallback(
    async (blockId: number) => {
      if (!accessToken) return;

      const confirmed = window.confirm(
        "Are you sure you want to remove this block? The blocked user will be able to interact with the blocker again."
      );
      if (!confirmed) return;

      setRemovingId(blockId);

      try {
        const result = await removeBlockByIdAdminController(
          accessToken,
          blockId.toString()
        );

        if (result.success) {
          toast.success(result.message || "Block removed successfully.");
          setBlocks((prev) => prev.filter((b) => b.blockId !== blockId));
          setTotalElements((prev) => prev - 1);

          // If removed last item on this page and not the first page, go back
          if (blocks.length === 1 && currentPage > 0) {
            fetchPage(currentPage - 1);
          }
        } else {
          toast.error(result.message || "Failed to remove block.");
        }
      } catch {
        toast.error("An unexpected error occurred.");
      } finally {
        setRemovingId(null);
      }
    },
    [accessToken, blocks.length, currentPage, fetchPage]
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-6 rounded-2xl bg-surface border border-border-default">
        <h2 className="text-lg font-bold text-heading flex items-center gap-2 mb-5">
          <ShieldBan className="w-5 h-5 text-steel dark:text-sky" />
          All User Blocks
          {!isLoading && (
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
              {totalElements}
            </span>
          )}
        </h2>

        {/* Loading */}
        {isLoading && blocks.length === 0 && (
          <div className="space-y-3">
            <BlockCardSkeleton />
            <BlockCardSkeleton />
            <BlockCardSkeleton />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center py-12 rounded-xl border border-dashed border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 mb-3" />
            <h3 className="text-sm font-semibold text-heading mb-1">
              Error loading blocks
            </h3>
            <p className="text-xs text-steel/60 dark:text-sky/40 mb-4">
              {error}
            </p>
            <button
              onClick={() => fetchPage(0)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-cream-50 bg-steel dark:bg-sky dark:text-navy transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 rounded-xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
              <ShieldBan className="w-6 h-6 text-steel/50 dark:text-sky/40" />
            </div>
            <h3 className="text-sm font-semibold text-heading mb-1">
              No Blocks Found
            </h3>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              There are no user blocks in the system.
            </p>
          </div>
        )}

        {/* List */}
        {!error && blocks.length > 0 && (
          <div className="space-y-2.5">
            {blocks.map((block) => (
              <div
                key={block.blockId}
                className="p-4 rounded-xl bg-surface border border-border-default"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-semibold text-heading truncate">
                      {block.blocker.username}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-steel/40 dark:text-sky/30 flex-shrink-0" />
                    <span className="text-sm font-semibold text-heading truncate">
                      {block.blocked.username}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveBlock(block.blockId)}
                    disabled={removingId === block.blockId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 hover:bg-red-100/80 dark:hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {removingId === block.blockId
                      ? "Removing..."
                      : "Remove Block"}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[11px] text-steel/50 dark:text-sky/40">
                    Created: {formatDate(block.createdAt)}
                  </span>
                  {block.reason && (
                    <span className="text-[11px] text-steel/50 dark:text-sky/40">
                      Reason: {block.reason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-subtle">
            <button
              onClick={() => fetchPage(currentPage - 1)}
              disabled={currentPage === 0 || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-steel dark:text-sky bg-cream-100/60 dark:bg-navy-700/40 border border-border-default hover:bg-cream-200/60 dark:hover:bg-navy-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs text-steel/50 dark:text-sky/30">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => fetchPage(currentPage + 1)}
              disabled={currentPage + 1 >= totalPages || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-steel dark:text-sky bg-cream-100/60 dark:bg-navy-700/40 border border-border-default hover:bg-cream-200/60 dark:hover:bg-navy-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
