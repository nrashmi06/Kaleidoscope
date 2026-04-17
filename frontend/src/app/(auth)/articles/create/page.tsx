// src/app/articles/create/page.tsx
'use client';

import BlogForm from '@/components/articles/BlogForm';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Page(): React.ReactElement {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border-subtle">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-heading transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">New Article</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <BlogForm />
      </div>
    </div>
  );
}
