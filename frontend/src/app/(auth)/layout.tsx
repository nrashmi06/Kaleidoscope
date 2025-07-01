"use client";

import React, { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import useClearStore from "@/hooks/clearStore";
import { logoutUser } from "@/services/auth/logout";
import TopNavbar from "@/components/layout/TopNavbar";
import { UserProfileCard } from "@/components/sidebar/UserProfileCard";
import { UserSidebar } from "@/components/sidebar/UserSidebar";
import { X, Menu } from "lucide-react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const clearStore = useClearStore();
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser(token);
      clearStore();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100/70 dark:bg-neutral-900">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="relative w-full h-full">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          <TopNavbar onLogout={handleLogout} />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 pt-14 md:flex-row flex-col overflow-hidden w-full">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:w-72 flex-shrink-0 h-full ">
          <div className="flex flex-col w-full h-full">
            {/* Fixed profile card */}
            <div className="sticky top-0 z-10 dark:bg-neutral-900 px-3 py-3  ">
              <UserProfileCard />
            </div>
          
            {/* Scrollable sidebar menu */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-3  ">
              <UserSidebar />
            </div>
          </div>
        </aside>


        {/* Slide-in Sidebar (mobile) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-64 h-full bg-white dark:bg-neutral-900 shadow-xl z-50 p-4 overflow-y-auto border-r border-gray-200 dark:border-neutral-800">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-800 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mt-10">
                <UserSidebar />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-3 min-w-0 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
