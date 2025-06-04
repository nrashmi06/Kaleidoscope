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
import ContactsSection from "@/components/layout/ContactSelections";

type DashboardLayoutProps = {
  children: ReactNode;
};
type Contact = {
  name: string;
  location: string;
  avatar: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setOpen(!mobile);
      setIsMobile(mobile);
    };
    handleResize(); // run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // // Redirect if no token
  // useEffect(() => {
  //   if (!token) {
  //     router.push("/login");
  //   }
  // }, [token, router]);

  // // Show spinner while redirecting
  // if (!token) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  //     </div>
  //   );
  // }

  const contacts: Contact[] = [
  { name: "Julie Mendez", location: "Memphis, TN, US", avatar: "/nature2.jpg" },
  { name: "Marian Montgomery", location: "Newark, NJ, US", avatar: "/nature2.jpg" },
  { name: "Joyce Reid", location: "Fort Worth, TX, US", avatar: "/nature2.jpg" },
  { name: "Alice Franklin", location: "Springfield, MA, US", avatar: "/nature2.jpg" },
  { name: "Domingo Flores", location: "Houston, TX, US", avatar: "/nature2.jpg" },
];

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
    <div className="flex flex-col min-h-screen w-full"> {/* changed w-screen to w-full and removed mr-10 here */}
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopNavbar onLogout={handleLogout} />
      </div>

      {/* Main layout below navbar */}
      <div className="flex flex-1 pt-0 md:pt-14 md:flex-row flex-col overflow-hidden w-full"> {/* changed w-screen to w-full */}
        <Sidebar open={open} setOpen={setOpen}>
          <div className="flex flex-col md:flex-row w-full h-full min-h-0"> {/* Added min-h-0 to enable proper flex scroll */}
            
            <SidebarBody className="overflow-y-auto hide-scrollbar bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex-shrink-0 p-4 space-y-4 min-h-0 max-h-screen">
              {/* Profile Card - Desktop only */}
              <div className="hidden md:block">
                <ProfileCard />
                <div className="w-full h-px bg-slate-200 dark:bg-neutral-800 my-4" />
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-2">
                {navigationLinks
                  .filter((link) => {
                    const hideOnDesktop = ["Profile", "Logout", "Settings"];
                    return isMobile || !hideOnDesktop.includes(link.label);
                  })
                  .map((link, idx) => (
                    <SidebarLink
                      key={idx}
                      link={link}
                      onClick={link.onClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all duration-150"
                    />
                  ))}
              </nav>

              <div className="w-full h-px bg-slate-200 dark:bg-neutral-800" />
              <ContactsSection contacts={contacts} />
            </SidebarBody>

            {/* Main content area */}
            <main className="flex-1 overflow-auto bg-white dark:bg-neutral-900 p-4 min-w-0 min-h-0">
              {children}
            </main>
          </div>
        </Sidebar>
      </div>
    </div>
  );
}
