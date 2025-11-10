"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const clearStore = useClearStore();
  // Destructure state from Redux store
  const { accessToken, isUserInterestSelected, role } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if user needs to complete interest selection (skip for admins)
  useEffect(() => {
    const isAdmin = role === 'ADMIN';
    // Check if the user is authenticated, hasn't selected interests, is not on the onboarding path, and is not an admin
    if (accessToken && !isUserInterestSelected && !pathname.includes('/onboarding') && !isAdmin) {
      console.log("Redirecting to onboarding - user hasn't selected interests");
      router.push('/onboarding/categories');
    }
  }, [accessToken, isUserInterestSelected, pathname, router, role]);

  const handleLogout = async () => {
    try {
      await logoutUser(accessToken);
      clearStore();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100/70 dark:bg-neutral-900">
      {/* Top Navbar (Fixed) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="relative w-full h-full">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          <TopNavbar onLogout={handleLogout} />
        </div>
      </div>

      {/* Main layout container (below navbar) */}
      <div className="flex flex-1 pt-14 md:flex-row flex-col overflow-hidden w-full">
        {/* Sidebar (desktop - fixed width) */}
        <aside className="hidden md:flex md:w-72 flex-shrink-0 h-full ">
          <div className="flex flex-col w-full h-full border-r border-gray-200 dark:border-neutral-800">
            {/* Fixed profile card - sticky */}
            <div className="sticky top-0 z-10 dark:bg-neutral-900 px-3 py-3 border-b border-gray-200 dark:border-neutral-800">
              <UserProfileCard />
            </div>
            
            {/* Scrollable sidebar menu */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-3">
              <UserSidebar />
            </div>
          </div>
        </aside>

        {/* Slide-in Sidebar (mobile - drawer) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer with slide-in transition */}
            <div className="relative w-64 h-full bg-white dark:bg-neutral-900 shadow-xl z-50 p-4 overflow-y-auto border-r border-gray-200 dark:border-neutral-800 transform translate-x-0 transition-transform duration-300">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-800 dark:text-white"
                aria-label="Close sidebar menu"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="mt-10">
                <UserProfileCard /> {/* Added Profile Card for mobile sidebar too */}
                <div className="mt-4">
                  <UserSidebar />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 min-h-0 py-3">
          {/* Content Wrapper for centering and max-width */}
          <div className="max-w-7xl mx-auto px-4 sm:px-30 lg:px-50">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}