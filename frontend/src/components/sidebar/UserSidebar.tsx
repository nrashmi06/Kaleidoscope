"use client";
import FollowSuggestions from "@/components/common/FollowSuggestions";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  ImageIcon,
  Settings,
  MapPin,
  Book,
  Bookmark,
} from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Feed", path: "/feed" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: MapPin, label: "Locations", path: "/locations" },
  { icon: Book, label: "Articles", path: "/articles" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: ImageIcon, label: "Gallery", path: "/gallery" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Navigation */}
      <nav className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="px-3 py-3">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
            Menu
          </p>
          <div className="space-y-1">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.path;

              return (
                <button
                  key={index}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isActive
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    }`}
                >
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "" : "text-gray-500 dark:text-neutral-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Suggestions */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <FollowSuggestions />
      </div>
    </div>
  );
}