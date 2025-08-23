import React from "react";
import { ArticleCard } from "@/components/articles/ArticleCard";

const articles = [
  { title: "DIGITAL\nTECHNOLOGY", views: 340 },
  { title: "FUTURE\nOF AI", views: 215 },
  { title: "CLOUD\nCOMPUTING", views: 190 },
  { title: "BLOCKCHAIN\nINNOVATION", views: 120 },
  { title: "QUANTUM\nCOMPUTING", views: 85 },
  { title: "ARTIFICIAL\nINTELLIGENCE", views: 85 },
];

export default function ArticlesPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-16 px-4">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto text-center mb-12 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Explore Featured Articles
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Discover insightful reads on cutting-edge technology, AI, blockchain, quantum computing and more.
        </p>
      </div>

      {/* Responsive Grid */}
      <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 px-2 sm:px-4">
        {articles.map((article, index) => (
          <div key={index} className="flex justify-center">
            <ArticleCard title={article.title} views={article.views} />
          </div>
        ))}
      </div>
    </div>
  );
}
