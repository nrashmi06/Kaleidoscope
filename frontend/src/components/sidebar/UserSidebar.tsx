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

  const mainItems = visibleItems.filter((item) => !item.adminOnly);
  const adminItems = visibleItems.filter((item) => item.adminOnly);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Navigation */}
      <nav>
        <div className="space-y-0.5">
          {mainItems.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]
                  ${
                    isActive
                      ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-md shadow-navy/15 dark:shadow-cream/10"
                      : "text-navy/60 dark:text-cream/55 hover:bg-cream-300/50 dark:hover:bg-navy-700/50 hover:text-navy dark:hover:text-cream"
                  }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive ? "" : "opacity-70"
                  }`}
                />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Admin section */}
      {adminItems.length > 0 && (
        <nav className="mt-2">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-steel/50 dark:text-sky/35">
            Admin
          </p>
          <div className="space-y-0.5">
            {adminItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]
                    ${
                      isActive
                        ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-md shadow-navy/15 dark:shadow-cream/10"
                        : "text-navy/60 dark:text-cream/55 hover:bg-cream-300/50 dark:hover:bg-navy-700/50 hover:text-navy dark:hover:text-cream"
                    }`}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Suggestions */}
      <div className="mt-2">
        <FollowSuggestions />
      </div>
    </div>
  );
}
