import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FireExtinguisher } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 transition-all duration-200 bg-white/70 backdrop-blur-md dark:bg-gray-950/70">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
                    <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}>
                        <FireExtinguisher />
                        <span className="sr-only">Safadasnow</span>
                    </Link>
                    <div className="mx-auto flex gap-2">
                        <Link
                            href="#"
                            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 hover:text-gray-900 focus:bg-white/20 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/50 data-[state=open]:bg-white/50 dark:bg-gray-950/10 dark:hover:bg-gray-950/20 dark:hover:text-gray-50 dark:focus:bg-gray-950/20 dark:focus:text-gray-50 dark:data-[active]:bg-gray-950/50 dark:data-[state=open]:bg-gray-950/50"
                            prefetch={false}
                        >
                            Home
                        </Link>
                        <Link
                            href="#"
                            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 hover:text-gray-900 focus:bg-white/20 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/50 data-[state=open]:bg-white/50 dark:bg-gray-950/10 dark:hover:bg-gray-950/20 dark:hover:text-gray-50 dark:focus:bg-gray-950/20 dark:focus:text-gray-50 dark:data-[active]:bg-gray-950/50 dark:data-[state=open]:bg-gray-950/50"
                            prefetch={false}
                        >
                            About us
                        </Link>
                        <Link
                            href="#"
                            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 hover:text-gray-900 focus:bg-white/20 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/50 data-[state=open]:bg-white/50 dark:bg-gray-950/10 dark:hover:bg-gray-950/20 dark:hover:text-gray-50 dark:focus:bg-gray-950/20 dark:focus:text-gray-50 dark:data-[active]:bg-gray-950/50 dark:data-[state=open]:bg-gray-950/50"
                            prefetch={false}
                        >
                            Find a companion
                        </Link>
                        <Link
                            href="#"
                            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 hover:text-gray-900 focus:bg-white/20 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/50 data-[state=open]:bg-white/50 dark:bg-gray-950/10 dark:hover:bg-gray-950/20 dark:hover:text-gray-50 dark:focus:bg-gray-950/20 dark:focus:text-gray-50 dark:data-[active]:bg-gray-950/50 dark:data-[state=open]:bg-gray-950/50"
                            prefetch={false}
                        >
                            Promote yourself
                        </Link>
                        <Link
                            href="#"
                            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 hover:text-gray-900 focus:bg-white/20 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/50 data-[state=open]:bg-white/50 dark:bg-gray-950/10 dark:hover:bg-gray-950/20 dark:hover:text-gray-50 dark:focus:bg-gray-950/20 dark:focus:text-gray-50 dark:data-[active]:bg-gray-950/50 dark:data-[state=open]:bg-gray-950/50"
                            prefetch={false}
                        >
                            Contact
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <SignedOut>
                            <Button className="px-2 py-1 text-xs">Login</Button>
                            <Button className="px-2 py-1 text-xs">Register</Button>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </header>
    );
}

