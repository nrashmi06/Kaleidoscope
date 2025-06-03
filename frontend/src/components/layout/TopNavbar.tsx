"use client";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function TopNavbar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const router = useRouter();

  return (
    <nav className="hidden md:flex justify-between items-center px-6 py-1 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shadow-sm">
      {/* Left: Logo */}
      <div
        className="text-xl font-bold text-indigo-800 dark:text-white cursor-pointer"
        onClick={() => router.push("/")}
      >
        <a
      href="./"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
    >
      <img
        src="/icon.png"
        alt="logo"
        width={30}
        height={30}
      />
      <span className="font-medium text-black dark:text-white">Kaleidoscope</span>
    </a>
      </div>

      {/* Right: Profile and Logout */}
      <div className="flex items-center space-x-6 text-sm font-medium text-indigo-900 dark:text-neutral-100">
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-1 hover:text-indigo-600"
        >
          <IconUser size={18} />
          Profile
        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 hover:text-red-600"
        >
          <IconLogout size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
}
