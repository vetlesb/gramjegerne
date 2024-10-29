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
    <a href="../" className="flex items-center space-x-3 rtl:space-x-reverse">
        <p className="text-2xl">Gramjegerne</p>
    </a>
   
    <div className="w-full md:block md:w-auto" id="navbar-default">
      <ul className="text-xl flex flex-col p-4 md:p-0 mt-4 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0">
      <li>
          <a href="../" className="block py-2 px-3 md:p-0" aria-current="page">Inventory</a>
        </li>
        <li>
          <a href="/lists" className="block py-2 px-3 md:p-0">Lists</a>
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
