'use client';

import React from "react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Button } from "@/components/ui/button"; 
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react"; 

const articles = [
  { title: "DIGITAL\nTECHNOLOGY", views: 340 },
  { title: "FUTURE\nOF AI", views: 215 },
  { title: "CLOUD\nCOMPUTING", views: 190 },
  { title: "BLOCKCHAIN\nINNOVATION", views: 120 },
  { title: "QUANTUM\nCOMPUTING", views: 85 },
  { title: "ARTIFICIAL\nINTELLIGENCE", views: 85 },
];

export default function ArticlesPage() {
  const router = useRouter();

  const handleCreateArticle = () => {
    router.push("/articles/create");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-10 px-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-10 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
              Explore Featured Articles
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
              Discover insightful reads on cutting-edge technology and more.
            </p>
          </div>
          
          {/* *** NEW CREATE ARTICLE BUTTON *** */}
          <Button
            onClick={handleCreateArticle}
            className="mt-6 sm:mt-0 px-6 py-3 shadow-lg hover:shadow-xl"
          >
            <PencilLine className="w-5 h-5 mr-2" />
            Create Article
          </Button>
          {/* ******************************* */}
        </div>
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