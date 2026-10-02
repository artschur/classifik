import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_HEADER, PATH_HEADER, hasEnglish, stripLocale } from "./lib/i18n";

// Define protected routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sitemap.xml",
  "/robots.txt",
  "/location",
  "/location/(.*)",
  "/companions",
  "/companions/(.*)",
  "/blog",
  "/blog/(.*)",
  // O /checkout fica deliberadamente fora desta lista: a tabela de preços é
  // informação para quem anuncia, não para quem procura acompanhante. O
  // portão que conta está na própria página, porque aqui qualquer sessão
  // autenticada passaria, incluindo a de um cliente.
  "/politica-de-cookies",
  "/politica-de-privacidade",
  "/termos-e-condicoes",
  "/sobre",
  "/contos",
  "/contos/(.*)",
  "/ajuda-anunciantes",
  "/quanto-ganha-acompanhante",
]);

// Define public API routes that should bypass auth
const isPublicApiRoute = createRouteMatcher([
  "/api/stripe", // Stripe webhook needs to be public
  "/api/webhook", // Add other webhook endpoints if needed
]);

/**
 * Versões em inglês: /en/x é reescrito para a mesma página /x, com o idioma
 * num cabeçalho interno que as páginas lêem. Páginas sem versão inglesa
 * redireccionam para o português. O cabeçalho é sempre definido aqui, por
 * isso um valor enviado de fora nunca chega às páginas.
 */
function withLocale(req: NextRequest) {
  const { locale, path } = stripLocale(req.nextUrl.pathname);
  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, locale);
  headers.set(PATH_HEADER, path);

  if (locale === "en") {
    if (!hasEnglish(path)) {
      const target = req.nextUrl.clone();
      target.pathname = path;
      return NextResponse.redirect(target, 307);
    }
    const target = req.nextUrl.clone();
    target.pathname = path;
    return NextResponse.rewrite(target, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export default clerkMiddleware(async (auth, req) => {
  // Pedidos /en/... de páginas com versão inglesa: são públicas como as
  // portuguesas, por isso seguem logo para a página.
  const { locale } = stripLocale(req.nextUrl.pathname);
  if (locale === "en") {
    return withLocale(req);
  }

  // Allow search engine bots to crawl public routes without redirection
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = /googlebot|bingbot|yandexbot|baiduspider|facebot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator/i.test(userAgent);

  if (isPublicApiRoute(req)) {
    return withLocale(req);
  }

  // Bots should only access public routes, if they hit a non-public route we let them proceed to the 404 or Auth check naturally
  if (isBot && isPublicRoute(req)) {
    return withLocale(req);
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    if (isPublicRoute(req)) {
      return withLocale(req);
    }
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  const metadata = sessionClaims?.metadata
  console.log(metadata)

  // if logged in allow to public routes
  if (isPublicRoute(req)) {
    return withLocale(req);
  }

  const isCompanion = metadata?.isCompanion;
  const onboardingComplete = metadata?.onboardingComplete;
  const isFirstStepRegistrationComplete = metadata?.isRegistrationComplete;
  const hasDocs = metadata?.hasUploadedDocs;

  if (onboardingComplete === false) {
    if (!req.nextUrl.pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return withLocale(req);
  }

  if (isCompanion) {
    if (isFirstStepRegistrationComplete === false) {
      if (!req.nextUrl.pathname.startsWith("/companions/register")) {
        return NextResponse.redirect(new URL("/companions/register", req.url));
      }
      return withLocale(req);
    }

    if (hasDocs === false) {
      if (!req.nextUrl.pathname.startsWith("/companions/verification")) {
        return NextResponse.redirect(new URL("/companions/verification", req.url));
      }
      return withLocale(req);
    }
  }

  return withLocale(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
