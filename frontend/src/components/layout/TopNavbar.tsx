"use client";

import {
  IconLogout,
  IconSettings,
  IconUser,
  IconPlus,
} from "@tabler/icons-react";
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

export default function TopNavbar({ onLogout }: TopNavbarProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-2 h-full gap-4">
      {/* Logo */}
      <div
        className="flex items-center cursor-pointer select-none"
        onClick={() => router.push("/feed")}
      >
        <Image
          src="/icon.png"
          alt="Logo"
          width={32}
          height={32}
          className="mr-3"
          priority
        />
        <span className="text-lg font-semibold text-navy dark:text-cream tracking-wide">
          Kaleidoscope
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 relative" ref={menuRef}>
        <button
          onClick={() => router.push("/create-post")}
          aria-label="Create Post"
          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-cream-50 bg-steel hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky/80 shadow-sm shadow-steel/20 dark:shadow-sky/15 transition-all duration-200 focus:outline-none cursor-pointer text-sm font-semibold"
        >
          <IconPlus size={18} />
          <span className="hidden lg:inline">Post</span>
        </button>

        <div className="relative flex items-center justify-center w-9 h-9">
          <NotificationBell />
        </div>

        <button
          onClick={() => setShowMenu((v) => !v)}
          className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-cream-300/60 dark:ring-navy-700/60 hover:ring-steel/50 dark:hover:ring-sky/40 transition-all duration-200 focus:outline-none ml-1 cursor-pointer"
        >
          <Image
            src={user.profilePictureUrl}
            alt="User Avatar"
            fill
            sizes="36px"
            className="object-cover"
          />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-12 w-44 bg-cream-50/95 dark:bg-navy-700/95 backdrop-blur-md rounded-xl shadow-lg shadow-navy/[0.06] dark:shadow-black/30 border border-cream-300/40 dark:border-navy-600/40 z-50 py-1 overflow-hidden">
            <button
              onClick={() => {
                setShowMenu(false);
                router.push(`/profile/${user.userId}`);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-navy dark:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-600/50 w-full text-left text-sm transition-colors cursor-pointer"
            >
              <IconUser size={17} className="text-steel dark:text-sky" />
              Profile
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                router.push("/settings");
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-navy dark:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-600/50 w-full text-left text-sm transition-colors cursor-pointer"
            >
              <IconSettings
                size={17}
                className="text-steel dark:text-sky"
              />
              Settings
            </button>
          </div>
        )}

        <button
          onClick={onLogout}
          aria-label="Logout"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <IconLogout size={19} />
        </button>
      </div>
    </nav>
  );
}
