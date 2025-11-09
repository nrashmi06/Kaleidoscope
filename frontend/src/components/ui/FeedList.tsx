// components/FeedList.tsx
"use client";

import { useState } from 'react';
import FeedCard from './FeedCard';
import { PostModal } from './PostModal';

interface FeedListProps {
  accessToken?: string;
}

export default function FeedList({ accessToken }: FeedListProps) {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample feed data - replace with your actual data source
  const feeds = [
    {
      id: 1,
      postId: 12, // This should come from your actual API
      username: "Robert Fox",
      handle: "@robertfox",
      image: "/nature1.jpg",
      text: "While Corfu gives us the ability to shoot by the sea, the golden hour light creates magical reflections",
      tags: ["#landscape", "#photography"]
    },
    {
      id: 2,
      postId: 15, // This should come from your actual API
      username: "Jane Smith",
      handle: "@janeshoots",
      image: "/nature2.jpg",
      text: "Exploring the hidden waterfalls of Costa Rica this weekend. The mist creates beautiful rainbows in the sunlight!",
      tags: ["#waterfall", "#travel"]
    },
    {
      id: 3,
      postId: 18, // This should come from your actual API
      username: "Mike Johnson",
      handle: "@mikeoutdoors",
      image: "/nature2.jpg",
      text: "Morning hike in the Rockies. The air is so crisp up here at 10,000 feet!",
      tags: ["#hiking", "#mountains"]
    }
  ];

  const handleViewDetails = (postId: number) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPostId(null);
  };

  return (
    <>
      <div className="w-full h-full overflow-y-auto bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <div className="space-y-4 px-4 pb-8">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              postId={feed.postId}
              username={feed.username}
              handle={feed.handle}
              image={feed.image}
              text={feed.text}
              tags={feed.tags}
              onViewDetails={handleViewDetails}
              accessToken={accessToken}
            />
          ))}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          accessToken={accessToken}
        />
      )}
    </>
  );
}
