import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
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
  // Skip auth for Stripe webhooks and other public API routes
  if (isPublicApiRoute(req)) {
    return NextResponse.next();
  }
  // For protected routes, ensure user is authenticated
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const hasDocs = sessionClaims?.metadata?.hasUploadedDocs;
  const isCompanion = sessionClaims?.metadata?.isCompanion;

  if (
    isCompanion === true &&
    hasDocs === false &&
    !(
      req.nextUrl.pathname.startsWith("/companions/verification") ||
      req.nextUrl.pathname.startsWith("/companions/register")
    )
  ) {
    return NextResponse.redirect(new URL("/companions/verification", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
