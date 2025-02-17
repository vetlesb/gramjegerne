'use client';

import {Icon} from '@/components/Icon';
import {ThemeSelector} from '@/components/ThemeSelector';
import {signIn, signOut, useSession} from 'next-auth/react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';

export function Navbar() {
  const {data: session, status} = useSession();
  const isLoading = status === 'loading';
  const pathname = usePathname();
  const isSharePage = pathname?.startsWith('/share/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="nav pb-8 relative">
      <div className="flex flex-wrap items-center justify-between mx-auto">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center">
            <span className="text-3xl text-accent">Gramjegerne</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden menu-item p-2">
          <Icon name="menu" width={24} height={24} />
        </button>

        {/* Right side - Desktop and Mobile Menu */}
        <div
          className={`
          flex items-center gap-4
          md:flex
          ${isMenuOpen ? 'flex' : 'hidden'}
          w-full md:w-auto
          flex-col md:flex-row
          absolute md:relative
          top-16 md:top-auto
          left-0 md:left-auto
          bg-background md:bg-transparent
          p-4 md:p-0
          z-50
        `}
        >
          {/* Menu items and auth buttons together */}

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto menu-collapse">
            {session && !isSharePage && (
              <ul className="text-xl flex flex-col md:flex-row gap-4 md:gap-x-2 w-full md:w-auto pt-8 md:pt-0 min-h-screen md:min-h-0">
                <li
                  className={
                    pathname === '/' ? 'menu-active flex text-center' : 'menu-item flex text-center'
                  }
                >
                  <Link
                    className="text-lg block w-full"
                    href="../"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Utstyr
                  </Link>
                </li>
                <li
                  className={
                    pathname === '/lists'
                      ? 'menu-active flex text-center'
                      : 'menu-item flex text-center'
                  }
                >
                  <Link
                    className="text-lg block w-full"
                    href="/lists"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lister
                  </Link>
                </li>
                <ThemeSelector />
                {/* Auth buttons now part of the collapsible menu */}
                {isLoading ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted mt-4" />
                ) : session ? (
                  <button
                    onClick={() => signOut()}
                    className="menu-item text-lg flex items-center w-full md:w-auto gap-x-1 justify-center"
                  >
                    Logg ut
                  </button>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="menu-item flex items-center gap-2 py-2 rounded-md w-full md:w-auto justify-center"
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
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
