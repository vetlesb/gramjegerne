'use client';

import {Icon} from '@/components/Icon';
import {useSession} from 'next-auth/react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';

export function Navbar() {
  const {data: session} = useSession();
  const pathname = usePathname();
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
          top-12 md:top-auto
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
                <li>
                  <Link
                    className={`text-lg text-center block w-full ${pathname === '/' ? 'menu-active' : 'menu-item'}`}
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gear
                  </Link>
                </li>
                <li>
                  <Link
                    className={`text-lg text-center block w-full ${pathname === '/lists' ? 'menu-active' : 'menu-item'}`}
                    href="/lists"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lists
                  </Link>
                </li>
                <li>
                  <Link
                    className={`text-lg text-center block w-full ${pathname === '/maps' ? 'menu-active' : 'menu-item'}`}
                    href="/maps"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Maps
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
