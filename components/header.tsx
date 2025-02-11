import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChartNoAxesColumnIncreasing, Heart, Menu } from 'lucide-react';
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

export default async function Header() {
  return (
    <header className="sticky top-0 z-50 transition-all duration-200 bg-white/70 backdrop-blur-md dark:bg-gray-950/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2"
            prefetch={false}
          >
            <Image
              src="/sugar-logo.svg"
              width={30}
              height={30}
              alt="onesugar"
            />
            <span className="font-bold text-xl hidden sm:inline">onesugar</span>
          </Link>
          <nav className="hidden md:flex gap-x-16">
            <Link
              href="/location"
              className="text-sm font-medium transition-all duration-300 text-white hover:bg-neutral-100 hover:text-black bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary"
              prefetch={false}
            >
              Encontre uma acompanhante
            </Link>
            <Link
              href="/companions/register"
              className="text-sm font-medium transition-all duration-300 text-white bg-primary/90 hover:bg-primary rounded-full py-2 px-4 hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary"
              prefetch={false}
            >
              Registre-se
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="hidden sm:inline-flex" size="sm">
                  Criar conta
                </Button>
              </SignUpButton>
            </SignedOut>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex flex-col justify-end pb-12"
              >
                <SheetTitle>{}</SheetTitle>
                <nav className="flex flex-col space-y-2">
                  <Link
                    href="/location"
                    className="text-sm  border border-neutral-200 rounded-xl p-2  font-medium transition-colors hover:text-primary flex items-center gap-4"
                    prefetch={false}
                  >
                    <Heart /> Encontre uma acompanhante
                  </Link>
                  <Link
                    href="/companions/register"
                    className="text-sm  border border-neutral-200 rounded-xl p-2 font-medium transition-colors hover:text-primary flex items-center gap-4"
                    prefetch={false}
                  >
                    <ChartNoAxesColumnIncreasing /> Registre-se
                  </Link>
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
                        <Button variant="ghost" size="sm">
                          Login
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button className=" sm:inline-flex" size="sm">
                          Criar conta
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
