import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    await auth.protect({ unauthenticatedUrl: new URL('/sign-in', request.url).toString() });
  }

  const userAgent = request.headers.get('user-agent') ?? '';
  if (request.nextUrl.pathname === '/newspaper' && /kindle/i.test(userAgent)) {
    const kindleUrl = request.nextUrl.clone();
    kindleUrl.pathname = '/newspaper/kindle';
    return NextResponse.rewrite(kindleUrl);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
