// components/FeedList.tsx
import FeedCard from './FeedCard';

export default function FeedList() {
  // Sample feed data - replace with your actual data source
  const feeds = [
    {
      id: 1,
      username: "Robert Fox",
      handle: "@robertfox",
      image: "/nature1.jpg",
      text: "While Corfu gives us the ability to shoot by the sea, the golden hour light creates magical reflections",
      tags: ["#landscape", "#photography"]
    },
    {
      id: 2,
      username: "Jane Smith",
      handle: "@janeshoots",
      image: "/nature2.jpg",
      text: "Exploring the hidden waterfalls of Costa Rica this weekend. The mist creates beautiful rainbows in the sunlight!",
      tags: ["#waterfall", "#travel"]
    },
    {
      id: 3,
      username: "Mike Johnson",
      handle: "@mikeoutdoors",
      image: "/nature2.jpg",
      text: "Morning hike in the Rockies. The air is so crisp up here at 10,000 feet!",
      tags: ["#hiking", "#mountains"]
    }
  ];

  return (
    <div className="w-full h-full overflow-y-auto">
      <div>
        {feeds.map((feed) => (
          <FeedCard
            key={feed.id}
            username={feed.username}
            handle={feed.handle}
            image={feed.image}
            text={feed.text}
            tags={feed.tags}
          />
        ))}
      </div>
    </div>
  );
}