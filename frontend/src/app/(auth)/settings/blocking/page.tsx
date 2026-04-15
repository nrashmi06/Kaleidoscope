// src/app/(auth)/settings/blocking/page.tsx
"use client";

import { BlockUserForm, BlockUserFormSkeleton } from "@/components/user-blocks/BlockUserForm";
import React, { Suspense } from "react";
import { ShieldAlert, Shield } from "lucide-react";

const BlockedUserListPlaceholder: React.FC = () => {
  return (
    <div className="w-full max-w-lg p-6 rounded-2xl bg-surface border border-border-default">
      <h2 className="text-lg font-bold text-heading mb-5 flex items-center gap-2">
        <Shield className="w-5 h-5 text-steel dark:text-sky" />
        Blocked Users
      </h2>

      <div className="flex flex-col items-center justify-center text-center py-12 rounded-xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
          <ShieldAlert className="w-6 h-6 text-steel/50 dark:text-sky/40" />
        </div>
        <h3 className="text-sm font-semibold text-heading mb-1">
          No Blocked Users
        </h3>
        <p className="text-xs text-steel/60 dark:text-sky/40">
          Users you block will appear here.
        </p>
      </div>
    </div>
  );
};

export default function BlockUserPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        <Suspense fallback={<BlockUserFormSkeleton />}>
          <BlockUserForm />
        </Suspense>
        <Suspense fallback={<BlockUserFormSkeleton />}>
          <BlockedUserListPlaceholder />
        </Suspense>
      </div>
    </div>
  );
}
