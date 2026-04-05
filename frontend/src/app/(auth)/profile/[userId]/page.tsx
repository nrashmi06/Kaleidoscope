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
        <div className="text-center p-8 bg-cream-50 dark:bg-navy-700/50 rounded-2xl border border-cream-300/40 dark:border-navy-700/40">
          <h1 className="text-2xl font-bold text-navy dark:text-cream mb-2">
            Invalid Profile ID
          </h1>
          <p className="text-sm text-steel dark:text-sky/60">
            The user ID provided is not valid.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-medium transition-colors inline-flex items-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      <UserProfile userId={userId} />
    </div>
  );
}
