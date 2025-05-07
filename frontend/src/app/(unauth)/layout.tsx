"use client";
import { ReactNode, useState, useEffect } from "react";
import {
  Navbar,
  NavBody,
  NavbarLogo,
  NavItems,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "@/components/ui/resizable-navbar";

const navItems = [
  { name: "Home", link: "/" },
];

export default function UnauthLayout({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Only runs on the client
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  if (!isClient) {
    return null; // Prevents rendering anything on the server
  }

  return (
    <>
      {/* Desktop Navigation */}
      <Navbar className="fixed top-0 left-0 right-0 z-50">
        <NavBody>
          <NavbarLogo />
            <NavItems items={navItems} className="hidden md:flex" />
          <div className="relative z-20 ml-auto flex items-center">
            <NavbarButton href="/login" variant="secondary" className="mr-2">
              Login
            </NavbarButton>
            <NavbarButton href="/signup" variant="primary">
              Sign Up
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle isOpen={isMenuOpen} onClick={toggleMenu} />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMenuOpen} onClose={closeMenu}>
              <NavItems items={navItems} className="flex flex-col" />
            <div className="mt-4 flex w-full flex-col gap-2">
              <NavbarButton href="/login" variant="secondary" className="w-full">
                Login
              </NavbarButton>
              <NavbarButton href="/signup" variant="primary" className="w-full">
                Sign Up
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Add padding to prevent content from hiding under fixed navbar */}
      <div className="pt-28 md:pt-0">
  <main>{children}</main>
</div>

    </>
  );
}
