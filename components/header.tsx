import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ChartNoAxesColumnIncreasing,
  Heart,
  HelpCircle,
  Menu,
  ScrollText,
  ShoppingBag,
  User,
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { ModeToggle } from './modeToggle';
import { isExternal } from 'util/types';
import { LocaleLink } from '@/components/locale-link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getLocale, getPathWithoutLocale } from '@/lib/locale.server';
import type { Locale } from '@/lib/i18n';

const NAV_TEXT = {
  pt: {
    plans: 'Planos',
    editProfile: 'Editar perfil',
    register: 'Registo',
    companions: 'Acompanhantes',
    stories: 'Contos',
    help: 'Ajuda no registo',
    verify: 'Verificar',
    profile: 'Perfil',
    login: 'Login',
    signUp: 'Registrar',
    openMenu: 'Abrir menu',
    blogUrl: 'https://blog.onesugar.pt',
  },
  en: {
    plans: 'Plans',
    editProfile: 'Edit profile',
    register: 'Advertise',
    companions: 'Escorts',
    stories: 'Stories',
    help: 'Advertiser help',
    verify: 'Verify',
    profile: 'Profile',
    login: 'Log in',
    signUp: 'Sign up',
    openMenu: 'Open menu',
    blogUrl: 'https://blog.onesugar.pt/en/',
  },
} as const;

export const admins = [
  'user_31n1xQBKnF2DWIj5UR4zZUJP3ZG', // Agência Classifik
  'user_3IXZlEwPFLdsmc4izgFYopSHsjF', // Duarte
];

/**
 * Admins acrescentados pelo ambiente, separados por vírgulas.
 *
 * Existe por causa do desenvolvimento local: a instância de testes do Clerk
 * tem utilizadores próprios, com identificadores diferentes dos de produção,
 * e sem isto não havia forma de abrir as páginas de administração em
 * localhost sem mexer no código de cada vez.
 *
 * A variável não tem prefixo público de propósito: todos os usos de isAdmin
 * são do lado do servidor, por isso nada disto chega ao navegador.
 */
function envAdmins(): string[] {
  return (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export const isAdmin = (userId: string): boolean => {
  return admins.includes(userId) || envAdmins().includes(userId);
};

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  prefetch?: boolean;
  className?: string;
  isExternal?: boolean;
}

// O Tailwind usa rem em text-sm, e rem olha sempre para o tamanho de letra
// do <html>, não para o elemento mais próximo. Não há como "isolar" um
// pedaço da página do zoom geral do site a não ser fixando o tamanho aqui
// em pixels, por isso o menu usa text-[14px] em vez de text-sm: o resto do
// site cresce com o zoom da raiz (app/globals.css), o menu não.
const desktopNavItemClassPrimary =
  'text-[14px] font-medium transition-all duration-300 text-white bg-primary/90 hover:bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary';
const desktopNavItemClassOutline =
  'text-[14px] font-medium transition-all duration-300 text-white hover:bg-neutral-100 hover:text-black bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary';
const mobileNavItemClass =
  'text-[14px] border border-neutral-200 rounded-xl p-2 font-medium transition-colors hover:text-primary flex items-center gap-4';

const registerTabClassName = desktopNavItemClassPrimary;

/**
 * A aba "Registo" muda de destino consoante quem clica: quem ainda não é
 * companion passa pela calculadora (vende a proposta, capta o contacto);
 * quem já tem conta de companion vai direto para o formulário, que serve
 * também de edição — reenviar alguém já registado para a calculadora
 * seria mandá-lo para trás.
 */
/**
 * A aba dos planos não aparece a quem procura acompanhante: preços de anúncio
 * não lhe dizem respeito. Também não aparece a quem ainda não entrou, que
 * antes era levado a uma página de login sem perceber porquê.
 *
 * Fica visível para todas as outras sessões, e não só para quem tem a marca
 * de anunciante, porque há contas legítimas sem essa marca — o mesmo critério
 * da própria página.
 */
function buildPlansNavItem(locale: Locale): NavItem {
  return {
    label: NAV_TEXT[locale].plans,
    href: '/checkout',
    icon: <ShoppingBag className="h-4 w-4" />,
    prefetch: true,
    className: desktopNavItemClassOutline,
  };
}

function buildRegisterNavItem(isRegisteredCompanion: boolean, locale: Locale): NavItem {
  const t = NAV_TEXT[locale];
  return isRegisteredCompanion
    ? {
      label: t.editProfile,
      href: '/companions/register',
      icon: <ChartNoAxesColumnIncreasing />,
      prefetch: false,
      className: registerTabClassName,
    }
    : {
      label: t.register,
      href: '/quanto-ganha-acompanhante',
      icon: <ChartNoAxesColumnIncreasing />,
      prefetch: false,
      className: registerTabClassName,
    };
}

// Os contos ainda não têm versão em inglês: no menu inglês ficam de fora.
function buildRestNavItems(locale: Locale): NavItem[] {
  const t = NAV_TEXT[locale];
  const items: NavItem[] = [
  {
    label: t.companions,
    href: '/location',
    icon: <Heart />,
    prefetch: false,
    className: desktopNavItemClassOutline,
  },
  {
    label: t.stories,
    href: '/contos',
    icon: <ScrollText className="h-4 w-4" />,
    prefetch: false,
    className: desktopNavItemClassOutline,
  },
  {
    label: t.help,
    href: '/ajuda-anunciantes',
    icon: <HelpCircle className="h-4 w-4" />,
    prefetch: false,
    className: desktopNavItemClassOutline,
  },
  {
    label: 'Blog',
    href: t.blogUrl,
    icon: <User className="h-4 w-4" />,
    prefetch: false,
    className: desktopNavItemClassOutline,
    isExternal: true,
  }
  ];
  return locale === 'en' ? items.filter((item) => item.href !== '/contos') : items;
}

export default async function Header() {
  const { userId, sessionClaims } = await auth();
  const [locale, currentPath] = await Promise.all([getLocale(), getPathWithoutLocale()]);
  const t = NAV_TEXT[locale];
  const isUserAdmin = userId && isAdmin(userId);
  const isRegisteredCompanion = sessionClaims?.metadata?.isCompanion === true;
  const isClient = sessionClaims?.metadata?.isCompanion === false;
  const navItems: NavItem[] = [
    buildRegisterNavItem(isRegisteredCompanion, locale),
    ...(userId && !isClient ? [buildPlansNavItem(locale)] : []),
    ...buildRestNavItems(locale),
  ];

  return (
    <header className="sticky top-0 z-50 transition-all duration-200 bg-white/70 backdrop-blur-md dark:bg-gray-950/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <LocaleLink
            locale={locale}
            href="/"
            className="flex items-center space-x-2"
            prefetch={false}
          >
            <Image
              src="/sugar-logo.svg"
              width={50}
              height={50}
              alt="onesugar"
              className="dark:invert"
            />
            <span className="font-bold text-xl hidden sm:inline">onesugar</span>
          </LocaleLink>
          {/* Desktop Nav */}
          {/* O espaçamento fixo de 4rem entre os itens não cabia abaixo dos
              1366px e empurrava o cabeçalho para fora do ecrã, criando scroll
              horizontal no site inteiro. Agora só é usado quando há espaço. */}
          <nav className="hidden lg:flex gap-x-4 xl:gap-x-10">
            {navItems.map(({ label, href, prefetch, className, isExternal }) => (
              <LocaleLink
                locale={locale}
                key={href}
                href={href}
                prefetch={prefetch}
                className={className}
                {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}

              >
                {label}
              </LocaleLink>
            ))}
            {isUserAdmin && (
              <Link
                href="/verify"
                className={desktopNavItemClassPrimary}
                prefetch={false}
              >
                {t.verify}
              </Link>
            )}
            {userId && (
              <Link
                href="/profile"
                className={desktopNavItemClassPrimary}
                prefetch={false}
              >
                {t.profile}
              </Link>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher locale={locale} initialPath={currentPath} className="hidden sm:flex" />
            <SignedIn>
              <UserButton />
              <ModeToggle />
            </SignedIn>
            <SignedOut>
              <SignInButton signUpForceRedirectUrl={"/onboarding"}>
                <Button variant="ghost" className="rounded-full" size="sm">
                  {t.login}
                </Button>
              </SignInButton>
              <SignUpButton signInForceRedirectUrl={"/onboarding"}>
                <Button
                  className="hidden sm:inline-flex rounded-full"
                  size="sm"
                >
                  {t.signUp}
                </Button>
              </SignUpButton>
              <ModeToggle />
            </SignedOut>
            {/* Mobile Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t.openMenu}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex flex-col justify-end pb-12"
              >
                <SheetTitle />
                <nav className="flex flex-col space-y-2">
                  {navItems.map(({ label, href, icon, isExternal }) => (
                    <LocaleLink
                      locale={locale}
                      key={href}
                      href={href}
                      className={mobileNavItemClass}
                      prefetch={false}
                      {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {icon} {label}
                    </LocaleLink>
                  ))}
                  {isUserAdmin && (
                    <Link
                      href="/verify"
                      className={mobileNavItemClass}
                      prefetch={false}
                    >
                      {t.verify}
                    </Link>
                  )}
                  {userId && (
                    <Link
                      href="/profile"
                      className={mobileNavItemClass}
                      prefetch={false}
                    >
                      <User className="h-4 w-4" />
                      {t.profile}
                    </Link>
                  )}
                </nav>
                <LanguageSwitcher locale={locale} initialPath={currentPath} className="mt-4" />
                <div className="mt-4">
                  <SignedIn>
                    <div className="flex items-center space-x-2 text-black">
                      <UserButton />
                    </div>
                  </SignedIn>
                  <SignedOut>
                    <div className="space-y-2">
                      <SignInButton>
                        <Button
                          variant="ghost"
                          className="rounded-full"
                          size="sm"
                        >
                          {t.login}
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button
                          className="sm:inline-flex rounded-full"
                          size="sm"
                        >
                          {t.signUp}
                        </Button>
                      </SignUpButton>
                    </div>
                  </SignedOut>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
