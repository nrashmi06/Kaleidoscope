// src/app/(auth)/profile/[userId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { UserProfile } from "@/components/user/UserProfile";
import { ArrowLeft } from "lucide-react";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.userId as string);

  if (isNaN(userId) || userId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Profile ID
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            The user ID provided is not valid.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 ">
      <UserProfile userId={userId} />
    </div>
  );
}