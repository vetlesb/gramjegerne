import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

export default withAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function middleware(req: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|auth).*)",
  ],
};
