import type { Metadata } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Gramjegerne",
  description: "For your next trip",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav>
          <div className="flex flex-wrap items-center justify-between mx-auto p-8">
            <a href="../" className="flex items-center">
              <p className="text-2xl">Gramjegerne</p>
            </a>

            <div className="md:block md:w-auto" id="navbar-default">
              <ul className="text-xl flex flex-row gap-x-4">
                <li className="menu-item">
                  <a href="../" className="block" aria-current="page">
                    Inventory
                  </a>
                </li>
                <li className="menu-item">
                  <a href="/lists" className="block">
                    Lists
                  </a>
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
