"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type Story = {
  id: number;
  username: string;
  avatar: string;
  hasStory: boolean;
  isViewed?: boolean;
};

const mockStories: Story[] = [
  { id: 1, username: "Your Story", avatar: "/person.jpg", hasStory: false },
  { id: 2, username: "Emma Wilson", avatar: "/person2.jpg", hasStory: true, isViewed: false },
  { id: 3, username: "Alex Chen", avatar: "/person3.jpg", hasStory: true, isViewed: true },
  { id: 4, username: "Sarah Miller", avatar: "/person4.jpg", hasStory: true, isViewed: false },
  { id: 5, username: "Mike Johnson", avatar: "/person5.jpg", hasStory: true, isViewed: true },
  { id: 6, username: "Lisa Garcia", avatar: "/person6.jpg", hasStory: true, isViewed: false },
  { id: 7, username: "David Brown", avatar: "/person7.jpg", hasStory: true, isViewed: false },
  { id: 8, username: "Rachel Lee", avatar: "/person8.jpg", hasStory: true, isViewed: true },
];

export default function StoryCircles() {
  const [stories, setStories] = useState(mockStories);

  const handleStoryClick = (storyId: number) => {
    if (storyId === 1) {
      console.log("Create story clicked");
      return;
    }

    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId ? { ...story, isViewed: true } : story
      )
    );
  };

  const getGradientClass = (story: Story) => {
    if (!story.hasStory) return "bg-gray-200 dark:bg-gray-700";
    if (story.isViewed) return "bg-gradient-to-tr from-blue-200 via-blue-100 to-blue-50";
    return "bg-gradient-to-tr from-blue-600 via-blue-400 to-blue-300";
  };

  return (
    <div className="w-full bg-white rounded-lg dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <div className="px-4 py-4">
        <div className="flex justify-between space-x-5 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex-shrink-0 cursor-pointer group"
              onClick={() => handleStoryClick(story.id)}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {/* Gradient Ring */}
                  <div
                    className={`
                      relative w-16 h-16 rounded-full p-[2px]
                      transition-all duration-300 ease-in-out transform group-hover:scale-105
                      ${getGradientClass(story)}
                    `}
                  >
                    {/* Inner Circle */}
                    <div className="bg-white dark:bg-gray-900 rounded-full p-[2px] w-full h-full">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <img
                          src={story.avatar}
                          alt={story.username}
                          className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              story.username
                            )}&background=3b82f6&color=fff&size=80`;
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add Icon for "Your Story" */}
                  {!story.hasStory && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* New Story Indicator */}
                  {story.hasStory && !story.isViewed && (
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
                  )}
                </div>

                {/* Username */}
                <div className="w-16 text-center">
                  <p
                    className={`
                      text-xs font-medium truncate px-1
                      ${story.id === 1
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"}
                      group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200
                    `}
                  >
                    {story.username}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hide scrollbars */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
