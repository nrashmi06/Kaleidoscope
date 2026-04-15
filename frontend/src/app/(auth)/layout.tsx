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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/60 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-steel dark:text-sky animate-spin" />
            <span className="text-sm font-medium text-navy/60 dark:text-cream/60">Signing out...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col min-h-screen w-full bg-[#f5f0e8] dark:bg-[#0a0a0f] grain relative">
        {/* Top Navbar — warm frosted glass */}
        <div className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-[#f5f0e8]/85 dark:bg-[#0a0a0f]/85 backdrop-blur-2xl backdrop-saturate-150">
          <div className="relative w-full h-full">
            <button
              className="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl hover:bg-cream-300/50 dark:hover:bg-navy-700/50 transition-colors active:scale-95"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-heading" />
            </button>
            <TopNavbar onLogout={handleLogout} />
          </div>
        </div>

        {/* Sidebar (desktop) — fixed, always pinned */}
        <aside className="hidden md:block fixed top-[56px] left-0 w-[250px] h-[calc(100vh-56px)] z-40">
          <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="px-3 pt-4 pb-1">
              <UserProfileCard />
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-6">
              <UserSidebar />
            </div>
          </div>
        </aside>

        {/* Mobile drawer sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative w-[280px] h-full bg-[#f5f0e8] dark:bg-[#0a0a0f] shadow-2xl shadow-black/20 z-50 overflow-y-auto transform translate-x-0 transition-transform duration-300">
              <div className="flex items-center justify-between px-4 pt-5 pb-2">
                <span className="text-sm font-display font-semibold text-heading">Menu</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-cream-300/50 dark:hover:bg-navy-700/50 transition-colors"
                  aria-label="Close sidebar menu"
                >
                  <X className="w-4 h-4 text-navy/60 dark:text-cream/60" />
                </button>
              </div>
              <div className="px-3 pt-2 pb-6 space-y-2">
                <UserProfileCard />
                <UserSidebar />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area — offset by sidebar width on desktop */}
        <main className="flex-1 pt-[56px] md:ml-[250px] min-h-screen">
          <div className="max-w-[1200px] mx-auto px-3 sm:px-5">{children}</div>
        </main>
      </div>
    </>
  );
}
