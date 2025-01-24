import { Suspense } from "react";
import { CompanionsList, CompanionsListSkeleton } from "@/components/companionsList";

export default function CompanionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Companions</h1>
      <Suspense fallback={<CompanionsListSkeleton />}>
        <CompanionsList />
      </Suspense>
    </div>
  );
}

