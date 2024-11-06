"use client";
import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="nav pb-8">
          <div className="flex flex-wrap items-center justify-between mx-auto">
            <p className="text-2xl">
              <Link href="../">Gramjegerne</Link>
            </p>

            <div className="md:block md:w-auto" id="navbar-default">
              <ul className="text-xl flex flex-row gap-x-2">
                <li className={pathname === "/" ? "menu-active" : "menu-item"}>
                  <div className="block items-center gap-x-2 flex flex-wrap">
                    <Link href="../">Utstyr</Link>
                  </div>
                </li>
                <li
                  className={
                    pathname === "/lists" ? "menu-active" : "menu-item"
                  }
                >
                  <div className="block items-center gap-x-2 flex flex-wrap">
                    <Link href="/lists">Pakklister</Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
