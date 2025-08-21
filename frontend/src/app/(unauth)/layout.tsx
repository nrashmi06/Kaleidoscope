"use client";
import { ReactNode, useState, useEffect } from "react";
import {
  Navbar,
  NavBody,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "@/components/ui/resizable-navbar";


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
          <div className="relative z-20 ml-auto flex items-center">
            <NavbarButton href="/" variant="secondary" className="mr-2">
              Home
            </NavbarButton>
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

          <MobileNavMenu
  isOpen={isMenuOpen}
  onClose={closeMenu}
  className="flex flex-col items-center p-4 "
>
  {/* Clear separation between nav items and buttons */}
  <div className="flex flex-col items-center gap-4 mt-6">
    <NavbarButton href="/" variant="secondary" className="mr-2">
              Home
    </NavbarButton>
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

      <div >
        <main>{children}</main>
      </div>
    </>
  );
}
