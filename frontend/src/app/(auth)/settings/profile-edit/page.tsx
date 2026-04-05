// src/app/(auth)/settings/profile-edit/page.tsx
"use client";

import { EditUserProfileForm } from "@/components/user/EditUserProfileForm";
import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function ProfileEditPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-steel dark:text-sky hover:text-steel-600 dark:hover:text-sky/80 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-sky shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <Pencil className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-cream">
              Edit Profile
            </h1>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              Update your biographical details and profile photos
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      <EditUserProfileForm />
    </div>
  );
}
