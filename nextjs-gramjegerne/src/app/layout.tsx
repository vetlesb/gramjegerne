// src/components/layout.tsx

"use client";

import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

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
  return (
    <html lang="en">
      <body className={`${apfel.variable} antialiased`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
