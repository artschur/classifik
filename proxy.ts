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

  if (!userId) {
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // if logged in allow to public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const metadata = sessionClaims?.metadata;
  const isCompanion = metadata?.isCompanion;
  const onboardingComplete = metadata?.onboardingComplete;
  const isFirstStepRegistrationComplete = metadata?.isRegistrationComplete;
  const hasDocs = metadata?.hasUploadedDocs;

  if (!onboardingComplete) {
    if (!req.nextUrl.pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  if (isCompanion) {
    if (!isFirstStepRegistrationComplete) {
      if (!req.nextUrl.pathname.startsWith("/companions/register")) {
        return NextResponse.redirect(new URL("/companions/register", req.url));
      }
      return NextResponse.next();
    }

    if (!hasDocs) {
      if (!req.nextUrl.pathname.startsWith("/companions/verification")) {
        return NextResponse.redirect(new URL("/companions/verification", req.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
