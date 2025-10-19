import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  router: ReturnType<typeof useRouter>;
}

export default function Header({ router }: HeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => router.back()}
        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Post</h1>
        <p className="text-gray-600 dark:text-gray-400">Share your thoughts with the world</p>
      </div>
    </div>
  );
}
