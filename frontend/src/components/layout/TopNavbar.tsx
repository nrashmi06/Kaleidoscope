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
    <nav className="hidden md:flex items-center justify-between px-6 h-full gap-4">
      {/* Logo — Apple minimal */}
      <div
        className="flex items-center cursor-pointer select-none group"
        onClick={() => router.push("/feed")}
      >
        <Image
          src="/icon.png"
          alt="Logo"
          width={28}
          height={28}
          className="mr-2.5 group-hover:scale-105 transition-transform duration-200"
          priority
        />
        <span className="text-[17px] font-display font-semibold text-navy dark:text-cream tracking-tight italic">
          Kaleidoscope
        </span>
      </div>

      {/* Actions — tight, icon-forward */}
      <div className="flex items-center gap-1 relative" ref={menuRef}>
        <button
          onClick={() => router.push("/create-post")}
          aria-label="Create Post"
          className="flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-full text-cream-50 bg-navy hover:bg-navy/80 dark:bg-cream dark:text-navy dark:hover:bg-cream/80 transition-all duration-200 focus:outline-none cursor-pointer text-[13px] font-semibold"
        >
          <IconPlus size={15} stroke={2.5} />
          <span className="hidden lg:inline">Create</span>
        </button>

        <div className="relative flex items-center justify-center w-9 h-9">
          <NotificationBell />
        </div>

        <button
          onClick={() => setShowMenu((v) => !v)}
          className="relative w-8 h-8 rounded-full overflow-hidden ring-[1.5px] ring-navy/10 dark:ring-cream/10 hover:ring-navy/25 dark:hover:ring-cream/25 transition-all duration-200 focus:outline-none ml-0.5 cursor-pointer"
        >
          <Image
            src={user.profilePictureUrl}
            alt="User Avatar"
            fill
            sizes="32px"
            className="object-cover"
          />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-11 w-48 bg-cream-50/95 dark:bg-navy-800/95 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/[0.08] dark:shadow-black/40 border border-cream-300/40 dark:border-navy-700/40 z-50 py-1.5 overflow-hidden">
            <button
              onClick={() => {
                setShowMenu(false);
                router.push(`/profile/${user.userId}`);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-navy/80 dark:text-cream/80 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 w-full text-left text-[13px] transition-colors cursor-pointer"
            >
              <IconUser size={16} className="text-navy/40 dark:text-cream/40" />
              Profile
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                router.push("/settings");
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-navy/80 dark:text-cream/80 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 w-full text-left text-[13px] transition-colors cursor-pointer"
            >
              <IconSettings size={16} className="text-navy/40 dark:text-cream/40" />
              Settings
            </button>
            <div className="mx-3 my-1 h-px bg-cream-300/50 dark:bg-navy-700/50" />
            <button
              onClick={() => {
                setShowMenu(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-red-500/80 hover:bg-red-500/[0.04] w-full text-left text-[13px] transition-colors cursor-pointer"
            >
              <IconLogout size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
