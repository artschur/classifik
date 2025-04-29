import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/',
  '/location',
  '/location/(.*)',
  '/companions',
]);

// Define public API routes that should bypass auth
const isPublicApiRoute = createRouteMatcher([
  '/api/stripe', // Stripe webhook needs to be public
  '/api/webhook', // Add other webhook endpoints if needed
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth for Stripe webhooks and other public API routes
  if (isPublicApiRoute(req)) {
    return NextResponse.next();
  }
  // For protected routes, ensure user is authenticated
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
