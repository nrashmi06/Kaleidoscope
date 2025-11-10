// src/app/(auth)/settings/profile-edit/page.tsx
"use client";

import { EditUserProfileForm } from "@/components/user/EditUserProfileForm";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

/**
 * Defines the route for the Profile Edit page (/settings/profile-edit).
 * This file hosts the EditUserProfileForm.
 */
export default function ProfileEditPage() {
  const router = useRouter();

  return (
    // Main container to provide background and vertical padding
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          {/* Back button for navigation consistency */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
            aria-label="Go back to profile or settings"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Settings</span>
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Edit Profile
          </h1>
          <p className="text-gray-600 dark:text-neutral-400 mt-1">
            Update your biographical details and profile photos.
          </p>
        </div>
        
        {/* The main form component, correctly linked to its data controller */}
        <EditUserProfileForm />
      </div>
    </div>
  );
}