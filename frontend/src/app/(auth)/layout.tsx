"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  IconHome,
  IconSearch,
  IconHeart,
  IconMessageCircle,
  IconSettings,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import useClearStore from "@/hooks/clearStore";
import { logoutUser } from "@/services/auth/logout";
import ProfileCard from "@/components/layout/ProfileCard";
import TopNavbar from "@/components/layout/TopNavbar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const clearStore = useClearStore();
  const token = useSelector((state: RootState) => state.auth.accessToken);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser(token);
      clearStore();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle sidebar toggle on resize
  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // Show spinner while redirecting
  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const navigationLinks = [
    { label: "Profile", href: "#", icon: <IconUser className="h-5 w-5" /> },
    { label: "Feed", href: "#", icon: <IconHome className="h-5 w-5" /> },
    { label: "Explore", href: "#", icon: <IconSearch className="h-5 w-5" /> },
    { label: "My favorites", href: "#", icon: <IconHeart className="h-5 w-5" /> },
    { label: "Direct", href: "#", icon: <IconMessageCircle className="h-5 w-5" /> },
    { label: "Settings", href: "#", icon: <IconSettings className="h-5 w-5" /> },
    {
      label: "Logout",
      href: "#",
      icon: <IconLogout className="h-5 w-5" />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-screen">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopNavbar onLogout={handleLogout} />
      </div>

      {/* Main layout below navbar */}
      {/* Remove top padding on mobile to fix white space */}
      <div className="flex flex-1 pt-0 md:pt-14 md:flex-row flex-col overflow-hidden w-screen">
        <Sidebar open={open} setOpen={setOpen}>
          <div className="flex h-full flex-col md:flex-row w-screen">
            <SidebarBody className="overflow-y-auto hide-scrollbar bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex-shrink-0">
              {/* Hide ProfileCard on mobile */}
              <div className="hidden md:block">
                <ProfileCard />
                <div className="w-full h-px bg-slate-100 my-2" />
              </div>

              <div className="flex flex-col space-y-1">
                {navigationLinks.map((link, idx) => (
                  <SidebarLink key={idx} link={link} onClick={link.onClick} />
                ))}
              </div>

              <div className="w-full h-px bg-slate-100 mt-2" />
            </SidebarBody>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-slate-100 dark:bg-neutral-900 p-4 min-w-0">
              {children}
            </main>
          </div>
        </Sidebar>
      </div>
    </div>
  );
}
