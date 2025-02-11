// src/components/layout.tsx

'use client';

import {Navbar} from '@/components/Navbar';
import {ThemeProvider} from '@/components/ThemeProvider';
import localFont from 'next/font/local';
import {usePathname} from 'next/navigation';
import {Toaster} from 'sonner';
import './globals.css';
import {Providers} from './providers';

const apfel = localFont({
  src: [
    {
      path: '../../public/fonts/ApfelGrotezk-Regular.woff2',
      weight: '400',
    },
    {
      path: '../../public/fonts/ApfelGrotezk-Mittel.woff2',
      weight: '500',
    },
    {
      path: '../../public/fonts/ApfelGrotezk-Fett.woff2',
      weight: '700',
    },
  ],
  variable: '--font-apfel',
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <html lang="en">
      <body className={`${apfel.variable} antialiased`}>
        <ThemeProvider>
          <Providers>
            {!isAuthPage && <Navbar />}
            {children}
          </Providers>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
