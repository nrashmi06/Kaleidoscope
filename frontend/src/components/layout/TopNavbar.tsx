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
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { getTaggableUsersController } from "@/controllers/userTagController/getTaggableUsersController";
import { useAccessToken } from "@/hooks/useAccessToken";
import type { TaggableUser } from "@/lib/types/usertag";

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
  const accessToken = useAccessToken();

  // User search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TaggableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch users when search query changes
  useEffect(() => {
    if (!debouncedSearch.trim() || !accessToken) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    getTaggableUsersController(accessToken, debouncedSearch, 0, 10)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.content) {
          setSearchResults(res.data.content);
        } else {
          setSearchResults([]);
        }
        setShowSearchResults(true);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => { cancelled = true; };
  }, [debouncedSearch, accessToken]);

  const handleUserClick = (userId: number) => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    router.push(`/profile/${userId}`);
  };

  return (
    <nav className="hidden md:flex items-center justify-between px-6 h-full gap-4">
      {/* Logo */}
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
        <span className="text-[17px] font-display font-semibold text-heading tracking-tight italic">
          Kaleidoscope
        </span>
      </div>

      {/* Global User Search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30 dark:text-cream/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            placeholder="Search people..."
            className="w-full h-9 pl-9 pr-8 text-sm bg-cream-300/30 dark:bg-navy-700/40 border-0 rounded-xl text-heading placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-navy/15 dark:focus:ring-cream/15 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-navy/30 dark:text-cream/30 hover:text-navy dark:hover:text-cream cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-cream-50 dark:bg-navy-700 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/[0.08] dark:shadow-black/40 border border-cream-300/40 dark:border-navy-600/40 z-50 py-1.5 overflow-hidden max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-navy/30 dark:text-cream/30" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted">
                No users found
              </div>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => handleUserClick(u.userId)}
                  className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-cream-300/40 dark:hover:bg-navy-600/40 transition-colors cursor-pointer"
                >
                  <Image
                    src={u.profilePictureUrl || "/person.jpg"}
                    alt={u.username}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover bg-cream-300/50 dark:bg-navy-600/50"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-heading truncate">
                      {u.username}
                    </p>
                    <p className="text-[11px] text-faint truncate">
                      {u.email}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions */}
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
          <div className="absolute right-0 top-11 w-48 bg-cream-50 dark:bg-navy-700 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/[0.08] dark:shadow-black/40 border border-cream-300/40 dark:border-navy-600/40 z-50 py-1.5 overflow-hidden">
            <button
              onClick={() => {
                setShowMenu(false);
                router.push(`/profile/${user.userId}`);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-navy/80 dark:text-cream/80 hover:bg-cream-300/40 dark:hover:bg-navy-600/40 w-full text-left text-[13px] transition-colors cursor-pointer"
            >
              <IconUser size={16} className="text-icon-muted" />
              Profile
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                router.push("/settings");
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-navy/80 dark:text-cream/80 hover:bg-cream-300/40 dark:hover:bg-navy-600/40 w-full text-left text-[13px] transition-colors cursor-pointer"
            >
              <IconSettings size={16} className="text-icon-muted" />
              Settings
            </button>
            <div className="mx-3 my-1 h-px bg-cream-300/50 dark:bg-navy-600/50" />
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
