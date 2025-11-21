// src/app/articles/create/page.tsx
'use client';

import BlogForm from '@/components/articles/BlogForm';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Next.js Page to host the BlogForm for creating new articles.
 */
export default function Page(): React.ReactElement {
  // We include useRouter here to enable navigation features often expected on new pages
  // Note: The BlogForm component already handles the primary UI/logic
  const router = useRouter();

  return (
    // Replaced inline styles with theme-aware Tailwind classes
    <div className="p-6 md:p-8 min-h-screen bg-gray-50 dark:bg-neutral-950">
      
      {/* Header and Back Button */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back</span>
        </button>
        
        {/* Replaced inline styles with theme-aware Tailwind classes */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Create Blog Post
        </h1>
      </div>
      
      <BlogForm />
    </div>
  );
}