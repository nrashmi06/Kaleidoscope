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
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import useClearStore from "@/hooks/clearStore";
import { logoutUser } from "@/services/auth/logout";

type Contact = {
  name: string;
  location: string;
  avatar: string;
};

const contacts: Contact[] = [
  { name: "Julie Mendez", location: "Memphis, TN, US", avatar: "/nature2.jpg" },
  { name: "Marian Montgomery", location: "Newark, NJ, US", avatar: "/nature2.jpg" },
  { name: "Joyce Reid", location: "Fort Worth, TX, US", avatar: "/nature2.jpg" },
  { name: "Alice Franklin", location: "Springfield, MA, US", avatar: "/nature2.jpg" },
  { name: "Domingo Flores", location: "Houston, TX, US", avatar: "/nature2.jpg" },
];

function ProfileSection() {
  return (
    <div className="flex flex-col items-center space-y-3 pb-6 p-6">
      <div className="relative">
        <img src="/nature2.jpg" className="h-16 w-16 rounded-full" alt="Profile" />
        <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-blue-500 border-2 border-white"></div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Cyndy Lillibridge</h2>
        <p className="text-sm text-gray-500">Portland, CA, United States</p>
      </div>
      <div className="flex w-full justify-between text-center">
        <div className="flex flex-col">
          <span className="font-semibold">368</span>
          <span className="text-xs text-gray-500">Posts</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">184.3K</span>
          <span className="text-xs text-gray-500">Followers</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">1.04M</span>
          <span className="text-xs text-gray-500">Following</span>
        </div>
      </div>
    </div>
  );
}

function ContactsSection({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="flex flex-col mt-4">
      <h3 className="mb-2 font-medium text-gray-500">Contacts</h3>
      <div className="flex flex-col space-y-3">
        {contacts.map((contact, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={contact.avatar} className="h-8 w-8 rounded-full" alt={contact.name} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-xs text-gray-500">{contact.location}</span>
              </div>
            </div>
            <button className="rounded-full p-1 hover:bg-gray-100">
              <IconMessageCircle className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ))}
        <a href="#" className="mt-2 text-center text-sm text-blue-500 hover:underline">
          View All
        </a>
      </div>
    </div>
  );
}

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
