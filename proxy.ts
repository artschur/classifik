import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/location",
  "/location/(.*)",
  "/companions",
  "/companions/(.*)",
  "/blog",
  "/blog/(.*)",
  "/politica-de-cookies",
  "/politica-de-privacidade",
  "/termos-e-condicoes",
  "/sobre",
]);

// Define public API routes that should bypass auth
const isPublicApiRoute = createRouteMatcher([
  "/api/stripe", // Stripe webhook needs to be public
  "/api/webhook", // Add other webhook endpoints if needed
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicApiRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  // 1. If not logged in and route is public, let them through
  // 2. If not logged in and route is private, auth.protect() handles the redirect
  if (!userId) {
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const metadata = sessionClaims?.metadata;
  const hasDocs = metadata?.hasUploadedDocs;
  const isCompanion = metadata?.isCompanion;
  const isFirstStepRegistrationComplete = metadata?.isRegistrationComplete;
  const onboardingComplete = metadata?.onboardingComplete;

  if (isCompanion && !onboardingComplete) {
    if (!req.nextUrl.pathname.startsWith("/companions/register")) {
      return NextResponse.redirect(new URL("/companions/register", req.url));
    }
    return NextResponse.next();
  }

  if (
    isCompanion === true &&
    hasDocs === false &&
    isFirstStepRegistrationComplete === false &&
    !req.nextUrl.pathname.startsWith("/companions/register")
  ) {
    return NextResponse.redirect(new URL("/companions/register", req.url));
  }

  if (
    isCompanion === true &&
    hasDocs === false &&
    isFirstStepRegistrationComplete === true &&
    !req.nextUrl.pathname.startsWith("/companions/verification") &&
    !req.nextUrl.pathname.startsWith("/companions/register")
  ) {
    return NextResponse.redirect(new URL("/companions/verification", req.url));
  }

  return NextResponse.next();
});


export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
