import {withAuth} from 'next-auth/middleware';
import {NextResponse, NextRequest} from 'next/server';

export default withAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function middleware(req: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({req, token}) => {
        // Allow access to share routes without authentication
        if (req.nextUrl.pathname.startsWith('/share')) {
          return true;
        }
        // Allow access to shared lists with ?shared=true query parameter
        if (req.nextUrl.pathname.startsWith('/lists/') && req.nextUrl.searchParams.get('shared') === 'true') {
          return true;
        }
        // Allow access to shared maps with ?share=[shareId] query parameter
        if (req.nextUrl.pathname === '/maps' && req.nextUrl.searchParams.get('share')) {
          return true;
        }
        // Require authentication for all other routes
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    // Update matcher to exclude share routes along with other public paths
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|auth|share).*)',
  ],
};
