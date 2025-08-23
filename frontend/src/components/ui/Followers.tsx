import Image from "next/image";
import Link from "next/link";

interface Follower {
  id: string;
  name: string;
  imagePath: string;
}

interface FollowersProps {
  followers?: Follower[];
  followerCount?: number;
  activeCount?: number;
  className?: string;
}

export default function Followers({
  followers = defaultFollowers,
  followerCount = 184300,
  activeCount = 42,
  className = ""
}: FollowersProps) {
  const formattedCount = new Intl.NumberFormat("en-US").format(followerCount);

  return (
    <div className={`bg-white dark:bg-neutral-900 p-6 rounded-lg shadow ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Followers</h3>
          <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-400">
            {formattedCount}
          </span>
        </div>

        {/* Avatar Grid */}
        <div className="relative">
          <div className="flex -space-x-2">
            {followers.slice(0, 7).map((follower) => (
              <div
                key={follower.id}
                className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white dark:border-neutral-900 transition-transform hover:z-10 hover:scale-110 hover:shadow-md"
              >
                <Image
                  src={follower.imagePath}
                  alt={follower.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {followers.length > 7 && (
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 bg-gray-100 dark:bg-neutral-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600">
                +{followers.length - 7}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center">
            <span className="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
              <span
                className="block h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                style={{ width: `${Math.min(100, (activeCount / followerCount) * 1000)}%` }}
              ></span>
            </span>
            <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              {activeCount} active
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="pt-2">
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {["About", "Help", "Privacy", "Terms"].map((label) => (
              <Link
                key={label}
                href="#"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultFollowers: Follower[] = [
  { id: "1", name: "User 1", imagePath: "/person3.jpg" },
  { id: "2", name: "User 2", imagePath: "/person4.jpg" },
  { id: "3", name: "User 3", imagePath: "/person5.jpg" },
  { id: "4", name: "User 4", imagePath: "/person6.jpg" },
  { id: "5", name: "User 5", imagePath: "/person7.jpg" },
  { id: "6", name: "User 6", imagePath: "/person8.jpg" },
  { id: "7", name: "User 7", imagePath: "/person3.jpg" },
  { id: "8", name: "User 8", imagePath: "/person4.jpg" },
  { id: "9", name: "User 9", imagePath: "/person5.jpg" },
];
