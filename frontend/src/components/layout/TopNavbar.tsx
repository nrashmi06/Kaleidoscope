"use client";
import {
  IconLogout,
  IconSettings,
  IconUser,
  IconBell,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "@tabler/icons-react";

export default function TopNavbar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [hasNotification] = useState(true); // ← example state
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close dropdown when clicking outside
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
    <nav className="hidden md:flex justify-between items-center px-6 py-2 bg-white dark:bg-neutral-900 border-b border-gray-300 dark:border-neutral-700 shadow-sm">
      {/* Left: Logo */}
      <div
        className="flex items-center cursor-pointer select-none"
        onClick={() => router.push("/")}
        aria-label="Home"
      >
        <Image
          src="/icon.png"
          alt="Kaleidoscope Logo"
          width={30}
          height={30}
          className="mr-3"
          priority
        />
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-wide">
          Kaleidoscope
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4 relative" ref={menuRef}>
        {/* Notification Bell */}
        <div className="relative">
  <button
    aria-label="Notifications"
    className="relative text-gray-700 cursor-pointer dark:text-gray-300 hover:text-blue-600 transition-colors duration-150 focus:outline-none "
  >
    <IconBell size={24} />
    {hasNotification && (
      <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full " />
    )}
  </button>
</div>
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  aria-label="Toggle dark mode"
  className="text-gray-700 cursor-pointer dark:text-gray-300 hover:text-yellow-500 transition-colors duration-150 focus:outline-none "
>
  {theme === "dark" ? <IconSun size={24} /> : <IconMoon size={24} />}
</button>


        {/* Profile avatar */}
        <button
          onClick={() => setShowMenu((v) => !v)}
          aria-label="User profile and menu"
          className="relative cursor-pointer w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-neutral-700 focus:outline-none "
        >
          <Image
            src="/person4.jpg"
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
                router.push("/profile");
              }}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 w-full text-left text-sm"
            >
              <IconUser size={18} />
              Profile
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                router.push("/settings");
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 w-full text-left text-sm cursor-pointer"
            >
              <IconSettings size={18} />
              Settings
            </button>
          </div>
        )}

        {/* Logout icon */}
        <button
          onClick={onLogout}
          aria-label="Logout"
          className="text-gray-700 dark:text-gray-300 hover:text-red-600 transition-colors duration-150 focus:outline-none cursor-pointer"
        >
          <IconLogout size={24} />
        </button>
      </div>
    </nav>
  );
}
