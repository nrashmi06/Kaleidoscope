"use client";

import {
  Home,
  Users,
  FileText,
  Play,
  ImageIcon,
  Settings,
} from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Feed", active: true },
  { icon: Users, label: "Friends" },
  { icon: FileText, label: "Articles" },
  { icon: Play, label: "Watch Videos" },
  { icon: ImageIcon, label: "Gallery" },
  { icon: Settings, label: "Settings" },
];

const suggestedUsers = [
  { name: "Don Jhon Doe", avatar: "/placeholder.svg" },
  { name: "Don Jhon Doe", avatar: "/placeholder.svg" },
  { name: "Don Jhon Doe", avatar: "/placeholder.svg" },
  { name: "Don Jhon Doe", avatar: "/placeholder.svg" },
  { name: "Don Jhon Doe", avatar: "/placeholder.svg" },
];

export function UserSidebar() {
  return (
    <div className="w-full flex flex-col bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800">
      {/* Navigation Items */}
      <div className="space-y-1 px-4 py-2">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${item.active
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200"}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

      {/* Suggested Users (Desktop only) */}
      <div className="p-4 hidden md:block">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Users You May Know
        </h4>
        <div className="space-y-3">
          {suggestedUsers.map((user, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-gray-600">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {user.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
