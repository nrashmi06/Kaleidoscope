"use client";
import FollowSuggestions from "@/components/common/FollowSuggestions";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  ImageIcon,
  Settings,
} from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Feed", path: "/feed" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: FileText, label: "Articles", path: "/articles" },
  { icon: ImageIcon, label: "Gallery", path: "/gallery" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

// suggestedUsers removed in favor of backend-driven FollowSuggestions

export function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-full flex flex-col bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800">
      {/* Navigation Items */}
      <div className="space-y-1 px-4 py-2">
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

      {/* Suggested Users */}
        {/* Follow suggestions (fetched from backend) */}
        <FollowSuggestions />
    </div>
  );
}
