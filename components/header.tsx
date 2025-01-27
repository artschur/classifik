import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChartNoAxesColumnIncreasing, FireExtinguisher, Heart, Home, Menu, MessageCircleHeart, PersonStanding, X } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default async function Header() {
    return (
        <header className="sticky top-0 z-50 transition-all duration-200 bg-white/70 backdrop-blur-md dark:bg-gray-950/70">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2" prefetch={false}>
                        <FireExtinguisher className="h-6 w-6" />
                        <span className="font-bold text-xl hidden sm:inline">Safadasnow</span>
                    </Link>
                    <nav className="hidden md:flex space-x-4">
                        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary" prefetch={false}>
                            Home
                        </Link>
                        <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary" prefetch={false}>
                            About us
                        </Link>
                        <Link href="/location" className="text-sm font-medium transition-colors hover:text-primary" prefetch={false}>
                            Find a companion
                        </Link>
                        <Link href="/companions/register" className="text-sm font-medium transition-colors hover:text-primary" prefetch={false}>
                            Promote yourself
                        </Link>
                        <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary" prefetch={false}>
                            Contact
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
                                    Register
                                </Button>
                            </SignUpButton>
                        </SignedOut>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="flex flex-col justify-end pb-12">
                                <nav className="flex flex-col space-y-8">
                                    <Link href="/" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-4" prefetch={false}>
                                        <Home /> Home
                                    </Link>
                                    <Link
                                        href="/about"
                                        className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-4"
                                        prefetch={false}
                                    >
                                        <PersonStanding /> About us
                                    </Link>
                                    <Link
                                        href="/location"
                                        className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-4"
                                        prefetch={false}
                                    >
                                        <Heart /> Find a companion
                                    </Link>
                                    <Link
                                        href="/companions/register"
                                        className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-4"
                                        prefetch={false}
                                    >
                                        <ChartNoAxesColumnIncreasing /> Promote yourself
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-4"
                                        prefetch={false}
                                    >
                                        <MessageCircleHeart /> Contact
                                    </Link>
                                </nav>
                                <div className="mt-4">
                                    <SignedIn>
                                        <UserButton />
                                    </SignedIn>
                                    <SignedOut>
                                        <div className="space-y-2">
                                            <SignInButton />
                                            <SignUpButton />
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

