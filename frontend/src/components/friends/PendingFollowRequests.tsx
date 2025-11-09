// src/components/friends/PendingFollowRequests.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getPendingFollowRequestsController } from "@/controllers/followRequests/getPendingFollowRequestsController";
import { approveFollowRequestController } from "@/controllers/followRequests/approveFollowRequestController";
import { rejectFollowRequestController } from "@/controllers/followRequests/rejectFollowRequestController"; // ✅ New import
import type { FollowRequestUser } from "@/lib/types/followRequests";
import { useAccessToken } from "@/hooks/useAccessToken";
import Image from "next/image";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast"; // Assuming toast is available globally or imported via react-hot-toast


// Placeholder component for individual request item
const FollowRequestItem: React.FC<{ 
  user: FollowRequestUser; 
  onAction: (userId: number, action: 'ACCEPT' | 'REJECT') => void 
}> = ({ user, onAction }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const accessToken = useAccessToken();

  // Unified handler for both actions
  const handleAction = useCallback(async (action: 'ACCEPT' | 'REJECT') => {
    setIsProcessing(true);
    let success = false;
    let message = "";

    try {
      if (action === 'ACCEPT') {
        // --- API Implementation for ACCEPT ---
        const res = await approveFollowRequestController(accessToken, user.userId);
        if (res.success) {
          success = true;
          message = res.message;
        } else {
          message = res.message || res.error || "Failed to approve request.";
        }
      } else {
        // --- API Implementation for REJECT ---
        const res = await rejectFollowRequestController(accessToken, user.userId); // ✅ Calling new controller
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
        onAction(user.userId, action); // Notify parent to remove the item
      } else {
        toast.error(message);
      }
    }
  }, [accessToken, user.userId, user.username, onAction]);


  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700 flex-shrink-0">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={40}
            height={40}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.username}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {isProcessing ? (
          <div className="flex items-center justify-center w-20 h-8 text-xs text-blue-500">
             <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <>
            <button
              onClick={() => handleAction('ACCEPT')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
              aria-label={`Accept follow request from ${user.username}`}
              disabled={isProcessing}
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              onClick={() => handleAction('REJECT')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
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
      const res = await getPendingFollowRequestsController(token, { page: 0, size: 20 });
      
      if (res.success && res.data?.data.content) {
        setRequests(res.data.data.content);
      } else {
        setError(res.error || res.data?.message || "Failed to load requests.");
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
  
  // The action parameter is now correctly removed from here to fix ESLint, 
  // but the function call in FollowRequestItem still passes it up, which is fine
  const handleRequestAction = useCallback((userId: number) => { 
      // Optimistically remove the user from the list on successful action (Accept or Reject)
      setRequests(prev => prev.filter(req => req.userId !== userId));
      
      // OPTIONAL: If accepted, you might want to trigger a refresh of the 'Following' list component 
      // by lifting state or using a context, but for now, simple removal suffices.
  }, []);


  if (loading) {
    return (
        <div className="p-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pending Requests</h2>
            {/* Simple skeleton loader */}
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
                    <div className="space-y-1">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                      <div className="w-32 h-3 bg-gray-200 dark:bg-neutral-700 rounded" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-16 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                    <div className="w-16 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
        </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">{error}</div>;
  }

  if (requests.length === 0) {
    return (
        <div className="p-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
             <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pending Requests</h2>
             <div className="text-sm text-gray-500 dark:text-gray-400 py-4 rounded-lg text-center ">
                 No pending follow requests.
             </div>
        </div>
    );
  }

  return (
    <div className="p-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Pending Requests <span className="ml-2 px-3 py-0.5 text-sm font-bold rounded-full bg-blue-600 text-white">{requests.length}</span>
      </h2>
      <div className="space-y-3">
        {requests.map((user) => (
          <FollowRequestItem key={user.userId} user={user} onAction={handleRequestAction} />
        ))}
      </div>
    </div>
  );
}