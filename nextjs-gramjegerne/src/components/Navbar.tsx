"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const pathname = usePathname();
  const isSharePage = pathname?.startsWith("/share/");

  return (
    <nav className="nav pb-8 relative">
      <div className="flex flex-wrap items-center justify-between mx-auto">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center">
            <span className="text-3xl text-accent">Gramjegerne</span>
          </Link>
        </div>

        {/* Right side - Show different content based on auth state and page */}
        <div className="flex items-center gap-4">
          {/* Only show menu items if logged in and not on share page */}
          {session && !isSharePage && (
            <ul className="text-xl flex flex-row gap-x-2">
              <li className={pathname === "/" ? "menu-active" : "menu-item"}>
                <Link className="text-lg" href="../">
                  Utstyr
                </Link>
              </li>
              <li
                className={pathname === "/lists" ? "menu-active" : "menu-item"}
              >
                <Link className="text-lg" href="/lists">
                  Pakklister
                </Link>
              </li>
            </ul>
          )}

          {/* Always show auth buttons */}
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <button
              onClick={() => signOut()}
              className="menu-item flex items-center"
            >
              <Icon name="logout" width={24} height={24} />
            </button>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="menu-item flex items-center gap-2 px-4 py-2 rounded-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Logg inn med Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
