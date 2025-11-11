// src/app/settings/blocking/page.tsx
"use client";

import { BlockUserForm, BlockUserFormSkeleton } from "@/components/user-blocks/BlockUserForm";
import React, { Suspense } from "react";
import { ListChecks, ShieldAlert } from "lucide-react";

/**
 * Placeholder component for showing a list of users
 * who are already blocked.
 */
const BlockedUserListPlaceholder: React.FC = () => {
  // This is an "Empty State" for the list
  return (
    <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <ListChecks className="w-6 h-6 text-blue-500" />
        Blocked Users
      </h2>
      
      {/* Empty State */}
      <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
        <ShieldAlert className="w-10 h-10 mx-auto text-gray-400 dark:text-neutral-500 mb-3" />
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">No Blocked Users</h3>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          Users you block will appear here.
        </p>
      </div>
    </div>
  );
};

/**
 * Page for managing user blocking settings.
 */
export default function BlockUserPage() {
  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-neutral-950 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* Block Form Component */}
        <Suspense fallback={<BlockUserFormSkeleton />}>
          <BlockUserForm />
        </Suspense>

        {/* List of Blocked Users (Placeholder) */}
        <Suspense fallback={<BlockUserFormSkeleton />}>
          <BlockedUserListPlaceholder />
        </Suspense>

      </div>
    </div>
  );
}