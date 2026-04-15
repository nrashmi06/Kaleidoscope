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
        className="p-2 rounded-lg bg-surface-alt border border-border-default hover:bg-cream-300/30 dark:hover:bg-navy-700/40 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-steel/60 dark:text-sky/40" />
      </button>
      <div>
        <h1 className="text-3xl font-display font-bold text-heading">Create New Post</h1>
        <p className="text-steel/60 dark:text-sky/40">Share your thoughts with the world</p>
      </div>
    </div>
  );
}
