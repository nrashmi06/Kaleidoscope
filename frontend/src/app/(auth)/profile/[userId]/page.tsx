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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-heading mb-2">
            Invalid Profile ID
          </h1>
          <p className="text-sm text-faint mb-6">
            The user ID provided is not valid.
          </p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2 bg-navy text-cream-50 dark:bg-cream dark:text-navy rounded-full text-sm font-medium transition-colors inline-flex items-center cursor-pointer hover:opacity-80"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <UserProfile userId={userId} />
    </div>
  );
}
