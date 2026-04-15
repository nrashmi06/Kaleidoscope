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
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-surface-alt border border-border-default hover:bg-cream-300/30 dark:hover:bg-navy-600/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-navy/60 dark:text-cream/50" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-heading">
              Create Article
            </h1>
            <p className="text-muted text-sm">
              Write and publish a new article
            </p>
          </div>
        </div>

        <BlogForm />
      </div>
    </div>
  );
}
