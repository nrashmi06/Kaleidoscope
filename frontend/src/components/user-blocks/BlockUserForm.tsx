// src/components/user-blocks/BlockUserForm.tsx
"use client";

import React, { useState } from "react";
import { blockUserController } from "@/controllers/user-blocks/blockUserController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Loader2, UserX, ShieldCheck, AlertCircle } from "lucide-react";

export const BlockUserFormSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-lg p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 animate-pulse">
      <div className="h-6 w-1/3 bg-cream-300/50 dark:bg-navy-600/50 rounded-md mb-6" />
      <div className="space-y-5">
        <div>
          <div className="h-4 w-1/4 bg-cream-300/40 dark:bg-navy-600/40 rounded mb-2" />
          <div className="h-11 w-full bg-cream-300/30 dark:bg-navy-600/30 rounded-xl" />
        </div>
        <div>
          <div className="h-4 w-1/4 bg-cream-300/40 dark:bg-navy-600/40 rounded mb-2" />
          <div className="h-24 w-full bg-cream-300/30 dark:bg-navy-600/30 rounded-xl" />
        </div>
        <div className="h-11 w-full bg-cream-300/40 dark:bg-navy-600/40 rounded-xl" />
      </div>
    </div>
  );
};

export const BlockUserForm: React.FC = () => {
  const [userIdToBlock, setUserIdToBlock] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accessToken = useAccessToken();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("You are not authenticated. Please log in.");
      setIsLoading(false);
      return;
    }

    const userIdNum = parseInt(userIdToBlock, 10);
    if (isNaN(userIdNum)) {
      setError("User ID must be a valid number.");
      setIsLoading(false);
      return;
    }

    const result = await blockUserController(
      { userIdToBlock: userIdNum, reason },
      accessToken
    );

    if (result.success) {
      setSuccess(result.message);
      setUserIdToBlock("");
      setReason("");
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-lg p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
      <h2 className="text-lg font-bold text-navy dark:text-cream flex items-center gap-2 mb-5">
        <UserX className="w-5 h-5 text-steel dark:text-sky" />
        Block a New User
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="userIdToBlock"
            className="text-sm font-semibold text-navy dark:text-cream"
          >
            User ID to Block
          </label>
          <input
            type="number"
            id="userIdToBlock"
            value={userIdToBlock}
            onChange={(e) => setUserIdToBlock(e.target.value)}
            placeholder="Enter the numeric User ID (e.g., 123)"
            required
            className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="reason"
            className="text-sm font-semibold text-navy dark:text-cream"
          >
            Reason
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason (min 10 characters)..."
            required
            minLength={10}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-cream-50 bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Confirm Block"
          )}
        </button>
      </form>

      {success && (
        <div className="mt-4 p-3.5 rounded-xl bg-steel/5 dark:bg-sky/5 border border-steel/15 dark:border-sky/15 text-steel dark:text-sky flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
