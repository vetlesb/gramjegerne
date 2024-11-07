"use client";
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

  return (
    <html lang="en">
      <body className={`${apfel.variable} antialiased`}>
        <nav className="nav pb-8">
          <div className="flex flex-wrap items-center justify-between mx-auto">
            <p className="logo">
              <Link href="../">Gramjegerne</Link>
            </p>

            <div className="md:block md:w-auto" id="navbar-default">
              <ul className="text-xl flex flex-row gap-x-2">
                <li className={pathname === "/" ? "menu-active" : "menu-item"}>
                  <div className="block items-center gap-x-2 h-fit flex flex-wrap">
                    <Link className="text-lg" href="../">
                      Utstyr
                    </Link>
                  </div>
                </li>
                <li
                  className={
                    pathname === "/lists" ? "menu-active" : "menu-item"
                  }
                >
                  <div className="block items-center gap-x-2 h-fit flex flex-wrap">
                    <Link className="text-lg" href="/lists">
                      Pakklister
                    </Link>
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
