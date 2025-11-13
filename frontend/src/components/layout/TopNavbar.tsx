"use client";

import { IconLogout, IconSettings, IconUser, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import NotificationBell from "@/components/ui/NotificationBell";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface TopNavbarProps {
  onLogout: () => void;
  onSearch?: (query: string) => void;
  currentSearchQuery?: string;
}

export default function TopNavbar({
  onLogout,
}: TopNavbarProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  // notification presence is driven by NotificationBell (redux)
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-2 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 shadow-sm gap-4">
      {/* Logo */}
      <div
        className="flex items-center cursor-pointer select-none"
        onClick={() => router.push("/")}
      >
        <Image src="/icon.png" alt="Logo" width={32} height={32} className="mr-3" priority />
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-wide">
          Kaleidoscope
        </span>
      </div>


      {/* Actions */}
        <div className="flex items-center gap-4 relative" ref={menuRef}>
          {/* Create Post */}
          <button
            onClick={() => router.push("/create-post")}
            aria-label="Create Post"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors duration-200 focus:outline-none"
          >
            <IconPlus size={20} />
          </button>
              
          {/* Notifications (reads unread count from redux) */}
          <div className="relative flex items-center justify-center w-10 h-10">
            <NotificationBell />
          </div>
          
          {/* Profile */}
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="relative w-10 h-10 rounded-full overflow-hidden hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors duration-200 focus:outline-none"
          >
            <Image
              src={user.profilePictureUrl}
              alt="User Avatar"
              fill
              sizes="40px"
              className="object-cover"
            />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-44 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-gray-200 dark:border-neutral-700 z-50">
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push(`/profile/${user.userId}`);
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 w-full text-left text-sm"
              >
                <IconUser size={18} />
                Profile
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push("/settings");
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 w-full text-left text-sm"
              >
                <IconSettings size={18} />
                Settings
              </button>
            </div>
          )}
        
          {/* Logout */}
          <button
            onClick={onLogout}
            aria-label="Logout"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <IconLogout size={20} />
          </button>
        </div>

    </nav>
  );
}
