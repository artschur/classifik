'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CompanionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    return (
        <section className="flex min-h-screen flex-col items-center justify-between p-12 w-full max-w-full md:p-24">
            <div className="z-10 max-w-5xl w-full items-star justify-between text-sm">
                <Button onClick={router.back}>Go back</Button>
            </div>
            <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">{children}</div>
        </section>
    );
}

