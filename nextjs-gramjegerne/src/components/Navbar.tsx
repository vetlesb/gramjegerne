'use client';

import {Icon} from '@/components/Icon';
import {useSession} from 'next-auth/react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';

export function Navbar() {
  const {data: session} = useSession();
  const pathname = usePathname();
  const isSharePage = pathname?.startsWith('/share/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="nav pb-8 relative">
      <div className="flex flex-wrap items-center justify-between mx-auto">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center">
            <span className="nav-logo text-3xl text-accent">Gramjegerne</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden menu-item p-2">
          <Icon name={isMenuOpen ? 'close' : 'menu'} width={24} height={24} />
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
            {session && (
              <ul className="text-xl flex flex-col md:flex-row gap-4 md:gap-x-2 w-full md:w-auto pt-8 md:pt-0 min-h-screen md:min-h-0">
                <li
                  className={
                    pathname === '/' ? 'menu-active flex text-center' : 'menu-item flex text-center'
                  }
                >
                  <Link
                    className="text-lg block w-full"
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gear
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
                    Lists
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
