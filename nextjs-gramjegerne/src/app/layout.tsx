// src/components/layout.tsx

"use client";

import { useState, useEffect } from "react"; // Import useState and useEffect
import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const apfel = localFont({
  src: [
    {
      path: "../../public/fonts/ApfelGrotezk-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/ApfelGrotezk-Mittel.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/ApfelGrotezk-Fett.woff2",
      weight: "700",
    },
  ],
  variable: "--font-apfel",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to manage menu visibility

  // Function to toggle menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Function to close menu when a link is clicked (optional)
  const handleLinkClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <html lang="en">
      <body className={`${apfel.variable} antialiased`}>
        <nav className="nav pb-8 relative">
          {" "}
          {/* Added 'relative' for positioning */}
          <div className="flex flex-wrap items-center justify-between mx-auto">
            {/* Logo */}
            <p className="logo">
              <Link href="../">Gramjegerne</Link>
            </p>

            {/* Menu Button for Mobile */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex items-center menu-item"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              {/* Icon Changes Based on Menu State */}
              {isMenuOpen ? (
                // Close Icon
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                // Hamburger Icon
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:block md:w-auto" id="navbar-default">
              <ul className="text-xl flex flex-row gap-x-2">
                <li className={pathname === "/" ? "menu-active" : "menu-item"}>
                  <Link className="text-lg block py-2 pr-4 pl-3" href="../">
                    Utstyr
                  </Link>
                </li>
                <li
                  className={
                    pathname === "/lists" ? "menu-active" : "menu-item"
                  }
                >
                  <Link className="text-lg block py-2 pr-4 pl-3" href="/lists">
                    Pakklister
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {/* Mobile Navigation Menu Overlay */}
          {isMenuOpen && (
            <div
              className="absolute top-full left-0 w-full nav-mobile min-h-[100vh] z-40 md:hidden overflow-hidden"
              id="mobile-menu"
            >
              <div className="flex flex-col h-full items-center py-4 space-y-4">
                {/* Mobile Menu Items */}
                <ul className="text-xl flex flex-col items-center gap-y-4 w-full">
                  <li
                    className={
                      pathname === "/"
                        ? "menu-active w-full text-center"
                        : "menu-item w-full text-center"
                    }
                  >
                    <Link
                      className="text-lg block py-2 px-4"
                      href="../"
                      onClick={handleLinkClick}
                    >
                      Utstyr
                    </Link>
                  </li>
                  <li
                    className={
                      pathname === "/lists"
                        ? "menu-active w-full text-center"
                        : "menu-item w-full text-center"
                    }
                  >
                    <Link
                      className="text-lg block py-2 px-4"
                      href="/lists"
                      onClick={handleLinkClick}
                    >
                      Pakklister
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </nav>
        {children}
      </body>
    </html>
  );
}
