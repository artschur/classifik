import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


const isProtectedRoute = createRouteMatcher(['/companions/register(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();
    if (isProtectedRoute(req)) await auth.protect();

    if (
        userId &&
        !sessionClaims?.metadata?.onboardingComplete &&
        req.nextUrl.pathname !== '/onboarding'
    ) {
        const onboardingUrl = new URL('/onboarding', req.url);
        return NextResponse.redirect(onboardingUrl);
    }

    if (userId && !isProtectedRoute(req)) {
        return NextResponse.next();
    }
});


export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};