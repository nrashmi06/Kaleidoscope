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
            className="p-2 rounded-lg bg-cream-50 dark:bg-navy-700/50 border border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-300/30 dark:hover:bg-navy-600/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-navy/60 dark:text-cream/50" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-cream">
              Create Article
            </h1>
            <p className="text-navy/50 dark:text-cream/40 text-sm">
              Write and publish a new article
            </p>
          </div>
        </div>

        <BlogForm />
      </div>
    </div>
  );
}
