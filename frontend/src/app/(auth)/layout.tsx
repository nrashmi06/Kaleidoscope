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
import { X, Menu, Loader2 } from "lucide-react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const clearStore = useClearStore();
  const { accessToken, isUserInterestSelected, role } = useSelector(
    (state: RootState) => state.auth
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const isAdmin = role === "ADMIN";
    if (
      accessToken &&
      !isUserInterestSelected &&
      !pathname.includes("/onboarding") &&
      !isAdmin
    ) {
      console.log(
        "Redirecting to onboarding - user hasn't selected interests"
      );
      router.push("/onboarding/categories");
    }
  }, [accessToken, isUserInterestSelected, pathname, router, role]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser(accessToken);
      clearStore();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      clearStore();
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/60 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-sky animate-spin" />
        </div>
      )}

      <div className="flex flex-col min-h-screen w-full bg-cream dark:bg-navy-900 grain relative">
        {/* Top Navbar — seamless, no hard border */}
        <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-cream-50/90 dark:bg-navy/90 backdrop-blur-md">
          <div className="relative w-full h-full">
            <button
              className="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6 text-navy dark:text-cream" />
            </button>
            <TopNavbar onLogout={handleLogout} />
          </div>
          {/* Subtle gradient fade instead of hard border */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cream-400/40 dark:via-navy-700/60 to-transparent" />
        </div>

        {/* Main layout container */}
        <div className="flex flex-1 pt-14 md:flex-row flex-col overflow-hidden w-full">
          {/* Sidebar (desktop) — seamless, no hard divider */}
          <aside className="hidden md:flex md:w-72 flex-shrink-0 h-full">
            <div className="flex flex-col w-full h-full">
              <div className="sticky top-0 z-10 px-3 pt-4 pb-3">
                <UserProfileCard />
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-4">
                <UserSidebar />
              </div>
            </div>
          </aside>

          {/* Mobile drawer sidebar */}
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div
                className="fixed inset-0 bg-navy/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsSidebarOpen(false)}
              />
              <div className="relative w-72 h-full bg-cream-50/95 dark:bg-navy/95 backdrop-blur-md shadow-2xl shadow-navy/10 dark:shadow-black/30 z-50 p-4 overflow-y-auto transform translate-x-0 transition-transform duration-300">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-navy dark:text-cream hover:bg-cream-300/50 dark:hover:bg-navy-700/50 transition-colors"
                  aria-label="Close sidebar menu"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mt-10 space-y-4">
                  <UserProfileCard />
                  <UserSidebar />
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto min-w-0 min-h-0 py-3">
            <div className="max-w-7xl mx-auto px-2">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
