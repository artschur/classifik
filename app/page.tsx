import { CompanionsList } from "@/components/ui/companionsList";
import { CompanionsListSkeleton } from "@/components/ui/companionsListSkeleton";
import { Suspense } from "react";


export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header>
        <h1>Welcome to the Blog</h1>
        <p>Read the latest posts below.</p>
      </header>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Suspense fallback={<CompanionsListSkeleton />}>
          <CompanionsList />
        </Suspense>
      </main >
    </div >
  );
}