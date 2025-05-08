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
import ContactsSection from "@/components/layout/ContactSelections";
import ProfileSection from "@/components/layout/ProfileSection";

type Contact = {
  name: string;
  location: string;
  avatar: string;
};

const contacts: Contact[] = [
  { name: "Julie Mendez", location: "Mumbai, Maharashtra, IN", avatar: "/nature2.jpg" },
  { name: "Marian Montgomery", location: "Bangalore, Karnataka, IN", avatar: "/nature2.jpg" },
  { name: "Joyce Reid", location: "Hyderabad, Telangana, IN", avatar: "/nature2.jpg" },
  { name: "Alice Franklin", location: "Chennai, Tamil Nadu, IN", avatar: "/nature2.jpg" },
  { name: "Domingo Flores", location: "Delhi, Delhi, IN", avatar: "/nature2.jpg" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const clearStore = useClearStore();
  const token = useSelector((state: RootState) => state.auth.accessToken);

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
      setOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) {
    return <div>Loading...</div>;
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
    <Sidebar open={open} setOpen={setOpen}>
      <div className="flex h-screen flex-col md:flex-row">
        <SidebarBody className="overflow-y-auto hide-scrollbar bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex-shrink-0">
          <ProfileSection />
          <div className="w-full h-0.5 bg-slate-100"></div>

          <div className="flex flex-col space-y-1">
            {navigationLinks.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                onClick={link.onClick ? link.onClick : undefined}
              />
            ))}
          </div>

          <div className="w-full h-0.5 bg-slate-100"></div>
          <ContactsSection contacts={contacts} />
        </SidebarBody>

        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-neutral-900 p-4">
          {children}
        </main>
      </div>
    </Sidebar>
  );
}
