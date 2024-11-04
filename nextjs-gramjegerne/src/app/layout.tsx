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
          <div className="flex flex-wrap items-center justify-between mx-auto p-4">
            <a href="../">
              <p className="text-2xl">Gramjegerne</p>
            </a>

            <div className="md:block md:w-auto" id="navbar-default">
              <ul className="text-xl flex flex-row gap-x-4">
                <li className="menu-item">
                  <a href="../" aria-current="page">
                    <div className="block items-center gap-x-2 flex flex-wrap">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 21 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.58605 16.7032C5.28917 16.7032 4.54699 15.9688 4.52355 14.6876L4.4298 6.99224L2.4298 7.44537C1.77355 7.60162 1.35167 7.32818 1.17199 6.64849L0.461049 4.00006C0.281362 3.32037 0.554799 2.84381 1.20324 2.56256L6.60949 0.179743C6.96105 0.023493 7.20324 0.0469305 7.48449 0.179743C8.42199 0.640681 9.3673 0.906305 10.5001 0.906305C11.6329 0.906305 12.5704 0.640681 13.5157 0.179743C13.797 0.0469305 14.0392 0.023493 14.3907 0.179743L19.797 2.56256C20.4454 2.84381 20.7111 3.32037 20.5314 4.00006L19.8204 6.64849C19.6407 7.32818 19.2267 7.60162 18.5626 7.44537L16.5704 6.99224L16.4689 14.6876C16.4532 15.9688 15.7032 16.7032 14.4142 16.7032H6.58605ZM6.59386 15.7657H14.3985C15.1329 15.7657 15.5314 15.3751 15.5392 14.6407L15.6407 6.17974C15.6407 5.98443 15.7814 5.87506 15.9923 5.91412L18.6017 6.49224C18.7892 6.53912 18.9064 6.46099 18.9532 6.29693L19.6173 3.85162C19.6798 3.61724 19.6173 3.51568 19.4064 3.42193L14.1407 1.10943C13.8204 2.84381 12.2657 4.09381 10.5001 4.09381C8.73449 4.09381 7.17199 2.84381 6.85949 1.10943L1.59386 3.42193C1.38292 3.51568 1.32042 3.61724 1.38292 3.85162L2.03917 6.29693C2.08605 6.46099 2.20324 6.53912 2.39074 6.49224L5.00792 5.91412C5.21105 5.87506 5.35949 5.98443 5.35949 6.17974L5.45324 14.6407C5.46886 15.3751 5.8673 15.7657 6.59386 15.7657ZM10.5001 1.78912C9.57042 1.78912 8.70324 1.60943 7.85167 1.25787C8.23449 2.38287 9.31261 3.16412 10.5001 3.16412C11.6876 3.16412 12.7579 2.38287 13.1407 1.25787C12.297 1.60943 11.422 1.78912 10.5001 1.78912Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                      <p id="hidden">Utstyr</p>
                    </div>
                  </a>
                </li>
                <li className="menu-item">
                  <a href="/lists">
                    <div className="block items-center gap-x-2 flex flex-wrap">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 23 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.05196 13.6953C0.356646 13.6953 0.114458 13.0703 0.403521 12.5L5.36446 2.53906C5.52071 2.23438 5.80196 2.03906 6.11446 2.03906C6.42696 2.03906 6.71602 2.23438 6.87227 2.53906L9.93477 8.70312L13.6691 1.21094C13.8488 0.84375 14.1848 0.625 14.552 0.625C14.9113 0.625 15.2473 0.84375 15.4348 1.21094L22.2395 14.8828C22.5754 15.5625 22.3176 16.2734 21.4973 16.2734H7.59883C6.77852 16.2734 6.52071 15.5625 6.86446 14.8828L7.4504 13.6953H1.05196ZM7.97383 15.3438H10.7941L14.1301 8.14844C14.2238 7.96094 14.3801 7.875 14.552 7.875C14.716 7.875 14.8723 7.96094 14.966 8.14844L18.302 15.3438H21.1691C21.3254 15.3438 21.3645 15.2188 21.2863 15.0469L14.6926 1.80469C14.6301 1.67188 14.4738 1.67188 14.4035 1.80469L7.80977 15.0469C7.73946 15.2031 7.78633 15.3438 7.97383 15.3438ZM1.4504 12.7734H3.39571L5.81758 7.55469C5.88008 7.42188 5.98946 7.35156 6.11446 7.35156C6.23946 7.35156 6.35665 7.42188 6.42696 7.55469L8.3879 11.8125L9.42696 9.73438L6.19258 3.25C6.16133 3.17188 6.0754 3.17188 6.03633 3.25L1.37227 12.6328C1.34102 12.7109 1.34883 12.7734 1.4504 12.7734ZM6.11446 8.74219L5.22383 12.7734H7.0129L6.11446 8.74219ZM14.552 9.77344L13.3098 15.3438H15.7863L14.552 9.77344Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                      <p id="hidden">Turer</p>
                    </div>
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
