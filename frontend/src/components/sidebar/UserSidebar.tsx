"use client";
import FollowSuggestions from "@/components/common/FollowSuggestions";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  Home,
  Users,
  Settings,
  MapPin,
  Book,
  Bookmark,
  Mail,
  UserCog,
  FileCheck,
} from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Feed", path: "/feed", adminOnly: false },
  { icon: Users, label: "Friends", path: "/friends", adminOnly: false },
  { icon: MapPin, label: "Locations", path: "/locations", adminOnly: false },
  { icon: Book, label: "Articles", path: "/articles", adminOnly: false },
  { icon: Bookmark, label: "Saved", path: "/saved", adminOnly: false },
  { icon: Settings, label: "Settings", path: "/settings", adminOnly: false },
  { icon: FileCheck, label: "Manage Articles", path: "/admin/articles", adminOnly: true },
  { icon: Mail, label: "Mass Email", path: "/admin/mass-email", adminOnly: true },
  { icon: UserCog, label: "Manage Users", path: "/admin/users", adminOnly: true },
];

export function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAppSelector((state) => state.auth.role);

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || role === "ADMIN"
  );

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Navigation */}
      <nav>
        <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-steel/60 dark:text-sky/40">
          Menu
        </p>
        <div className="space-y-0.5">
          {visibleItems.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                      : "text-navy/80 dark:text-cream/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 hover:text-navy dark:hover:text-cream"
                  }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive
                      ? ""
                      : "text-steel/70 dark:text-sky/50"
                  }`}
                />
                {item.label}
                {item.adminOnly && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Subtle separator */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

      {/* Suggestions */}
      <div>
        <FollowSuggestions />
      </div>
    </div>
  );
}
