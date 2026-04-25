'use client';

import {Icon} from '@/components/Icon';
import {SettingsDialog} from '@/components/SettingsDialog';
import {useSession} from 'next-auth/react';
import {useLanguage} from '@/i18n/LanguageProvider';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';

export function Navbar() {
  const {data: session} = useSession();
  const {t} = useLanguage();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
                    {t.nav.gear}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`text-lg text-center block w-full ${pathname.startsWith('/lists') ? 'menu-active' : 'menu-item'}`}
                    href="/lists"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.nav.lists}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`text-lg text-center block w-full ${pathname.startsWith('/trips') ? 'menu-active' : 'menu-item'}`}
                    href="/trips"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.nav.trips}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`text-lg text-center block w-full ${pathname.startsWith('/maps') ? 'menu-active' : 'menu-item'}`}
                    href="/maps"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.nav.maps}
                  </Link>
                </li>
                <li>
                  <button
                    className={`text-lg text-center block w-full md:hidden ${isSettingsOpen ? 'menu-active' : 'menu-item'}`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                  >
                    {t.nav.settings}
                  </button>
                  <button
                    className={`hidden md:flex items-center justify-center ${isSettingsOpen ? 'menu-active' : 'menu-item'}`}
                    style={{minHeight: 46}}
                    onClick={() => setIsSettingsOpen(true)}
                    aria-label={t.nav.settings}
                    title={t.nav.settings}
                  >
                    <Icon name="settings" width={20} height={20} />
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </nav>
  );
}
