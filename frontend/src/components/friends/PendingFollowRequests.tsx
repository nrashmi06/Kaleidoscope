// src/components/friends/PendingFollowRequests.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getPendingFollowRequestsController } from "@/controllers/followRequests/getPendingFollowRequestsController";
import { approveFollowRequestController } from "@/controllers/followRequests/approveFollowRequestController";
import { rejectFollowRequestController } from "@/controllers/followRequests/rejectFollowRequestController";
import type { FollowRequestUser } from "@/lib/types/followRequests";
import { useAccessToken } from "@/hooks/useAccessToken";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Bell } from "lucide-react";
import { toast } from "react-hot-toast";

const FollowRequestItem: React.FC<{
  user: FollowRequestUser;
  onAction: (userId: number, action: "ACCEPT" | "REJECT") => void;
}> = ({ user, onAction }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const accessToken = useAccessToken();
  const router = useRouter();

  const handleAction = useCallback(
    async (action: "ACCEPT" | "REJECT") => {
      setIsProcessing(true);
      let success = false;
      let message = "";

      try {
        if (action === "ACCEPT") {
          const res = await approveFollowRequestController(
            accessToken,
            user.userId
          );
          if (res.success) {
            success = true;
            message = res.message;
          } else {
            message =
              res.message || res.error || "Failed to approve request.";
          }
        } else {
          const res = await rejectFollowRequestController(
            accessToken,
            user.userId
          );
          if (res.success) {
            success = true;
            message = res.message;
          } else {
            message = res.message || res.error || "Failed to reject request.";
          }
        }
      } catch (err) {
        message = err instanceof Error ? err.message : String(err);
        success = false;
      } finally {
        setIsProcessing(false);

        if (success) {
          toast.success(message);
          onAction(user.userId, action);
        } else {
          toast.error(message);
        }
      }
    },
    [accessToken, user.userId, onAction]
  );

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl bg-cream-100/50 dark:bg-navy-700/30 border border-border-default transition-all hover:shadow-sm">
      <div
        className="flex items-center gap-3 min-w-0 cursor-pointer"
        onClick={() => router.push(`/profile/${user.userId}`)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-700 ring-2 ring-cream-300/50 dark:ring-navy-600/50 flex-shrink-0">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={40}
            height={40}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-heading truncate hover:underline">
            {user.username}
          </div>
          <div className="text-[11px] text-steel dark:text-sky/60 truncate">
            {user.email}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isProcessing ? (
          <div className="flex items-center justify-center w-20 h-8">
            <Loader2 className="w-4 h-4 animate-spin text-steel dark:text-sky" />
          </div>
        ) : (
          <>
            <button
              onClick={() => handleAction("ACCEPT")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-steel text-cream-50 hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky-300 transition-colors cursor-pointer"
              aria-label={`Accept follow request from ${user.username}`}
              disabled={isProcessing}
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              onClick={() => handleAction("REJECT")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
              aria-label={`Reject follow request from ${user.username}`}
              disabled={isProcessing}
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default function PendingFollowRequests() {
  const token = useAccessToken();
  const [requests, setRequests] = useState<FollowRequestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!token) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getPendingFollowRequestsController(token, {
        page: 0,
        size: 20,
      });

      if (res.success && res.data?.data.content) {
        setRequests(res.data.data.content);
      } else {
        setError(
          res.error || res.data?.message || "Failed to load requests."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred while fetching requests.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleRequestAction = useCallback((userId: number) => {
    setRequests((prev) => prev.filter((req) => req.userId !== userId));
  }, []);

  if (loading) {
    return (
      <div className="relative rounded-2xl border border-cream-300/60 dark:border-navy-700/60 bg-cream-50/80 dark:bg-navy/80 backdrop-blur-sm p-5 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel/25 dark:via-sky/15 to-transparent" />
        <h2 className="text-base font-semibold mb-4 text-heading flex items-center gap-2">
          <Bell className="w-4 h-4 text-steel dark:text-sky" />
          Pending Requests
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3.5 rounded-xl bg-cream-100/50 dark:bg-navy-700/30 border border-border-subtle animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cream-300 dark:bg-navy-700" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3.5 bg-cream-300 dark:bg-navy-700 rounded-full" />
                  <div className="w-32 h-2.5 bg-cream-300/70 dark:bg-navy-700/70 rounded-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-7 bg-cream-300 dark:bg-navy-700 rounded-lg" />
                <div className="w-16 h-7 bg-cream-300 dark:bg-navy-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-200/60 dark:border-red-900/30">
        {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="relative rounded-2xl border border-cream-300/60 dark:border-navy-700/60 bg-cream-50/80 dark:bg-navy/80 backdrop-blur-sm p-5 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel/25 dark:via-sky/15 to-transparent" />
        <h2 className="text-base font-semibold mb-3 text-heading flex items-center gap-2">
          <Bell className="w-4 h-4 text-steel dark:text-sky" />
          Pending Requests
        </h2>
        <div className="text-sm text-steel dark:text-sky/60 py-3 text-center">
          No pending follow requests.
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-cream-300/60 dark:border-navy-700/60 bg-cream-50/80 dark:bg-navy/80 backdrop-blur-sm p-5 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel/25 dark:via-sky/15 to-transparent" />
      <h2 className="text-base font-semibold mb-4 text-heading flex items-center gap-2">
        <Bell className="w-4 h-4 text-steel dark:text-sky" />
        Pending Requests
        <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-steel text-cream-50 dark:bg-sky dark:text-navy">
          {requests.length}
        </span>
      </h2>
      <div className="space-y-2.5">
        {requests.map((user) => (
          <FollowRequestItem
            key={user.userId}
            user={user}
            onAction={handleRequestAction}
          />
        ))}
      </div>
    </div>
  );
}
