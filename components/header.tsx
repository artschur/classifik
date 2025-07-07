import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChartNoAxesColumnIncreasing, Heart, Menu, ShoppingBag, User } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { ModeToggle } from './modeToggle';

export const admins = [
  `user_2wYHzDclTd4kDn7lCymwRzxsUli`,
  'user_2wbWQFZpqPydugGRwP4XKRpifIV',
  'user_2wUrNhvJel2On5NiLkgOswjKndD',
  'user_2s07vybL9GSrjPbhjljghGwzl1X',
];

export const isAdmin = (userId: string): boolean => {
  return admins.includes(userId);
};

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  prefetch?: boolean;
  className?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Registro',
    href: '/companions/register',
    icon: <ChartNoAxesColumnIncreasing />,
    prefetch: false,
    className:
      'text-sm font-medium transition-all duration-300 text-white bg-primary/90 hover:bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary',
  },
  {
    label: 'Acompanhantes',
    href: '/location',
    icon: <Heart />,
    prefetch: false,
    className:
      'text-sm font-medium transition-all duration-300 text-white hover:bg-neutral-100 hover:text-black bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary',
  },
  {
    label: 'Comprar',
    href: '/checkout',
    icon: <ShoppingBag className="h-4 w-4" />,
    prefetch: true,
    className:
      'text-sm font-medium transition-all duration-300 text-white hover:bg-neutral-100 hover:text-black bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary',
  },
];

export default async function Header() {
  const { userId } = await auth();
  const isUserAdmin = userId && isAdmin(userId);

  return (
    <header className="sticky top-0 z-50 transition-all duration-200 bg-white/70 backdrop-blur-md dark:bg-gray-950/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" prefetch={false}>
            <Image
              src="/sugar-logo.svg"
              width={50}
              height={50}
              alt="onesugar"
              className="dark:invert"
            />
            <span className="font-bold text-xl hidden sm:inline">onesugar</span>
          </Link>
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-x-16">
            {navItems.map(({ label, href, prefetch, className }) => (
              <Link key={href} href={href} prefetch={prefetch} className={className}>
                {label}
              </Link>
            ))}
            {isUserAdmin && (
              <Link
                href="/verify"
                className="text-sm font-medium transition-all duration-300 text-white bg-primary/90 hover:bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary"
                prefetch={false}
              >
                Verificar
              </Link>
            )}
            {userId && (
              <Link
                href="/profile"
                className="text-sm font-medium transition-all duration-300 text-white bg-primary/90 hover:bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary"
                prefetch={false}
              >
                Perfil
              </Link>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            <SignedIn>
              <UserButton />
              <ModeToggle />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button variant="ghost" className="rounded-full" size="sm">
                  Login
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="hidden sm:inline-flex rounded-full" size="sm">
                  Registrar
                </Button>
              </SignUpButton>
              <ModeToggle />
            </SignedOut>
            {/* Mobile Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col justify-end pb-12">
                <SheetTitle />
                <nav className="flex flex-col space-y-2">
                  {navItems.map(({ label, href, icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-sm border border-neutral-200 rounded-xl p-2 font-medium transition-colors hover:text-primary flex items-center gap-4"
                      prefetch={false}
                    >
                      {icon} {label}
                    </Link>
                  ))}
                  {isUserAdmin && (
                    <Link
                      href="/verify"
                      className="text-sm border border-neutral-200 rounded-xl p-2 font-medium transition-colors hover:text-primary flex items-center gap-4"
                      prefetch={false}
                    >
                      Verificar
                    </Link>
                  )}
                  {userId && (
                    <Link
                      href="/profile"
                      className="text-sm border border-neutral-200 rounded-xl p-2 font-medium transition-colors hover:text-primary flex items-center gap-4"
                      prefetch={false}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                  )}
                </nav>
                <div className="mt-4">
                  <SignedIn>
                    <div className="flex items-center space-x-2 text-black">
                      <UserButton />
                    </div>
                  </SignedIn>
                  <SignedOut>
                    <div className="space-y-2">
                      <SignInButton>
                        <Button variant="ghost" className="rounded-full" size="sm">
                          Login
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button className="sm:inline-flex rounded-full" size="sm">
                          Registrar
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
