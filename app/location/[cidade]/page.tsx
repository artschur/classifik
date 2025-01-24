import { Suspense } from "react";
import { CompanionsList, CompanionsListSkeleton } from "@/components/companionsList";

export default async function CompanionsPage({ params, }: { params: Promise<{ cidade: string; }>; }) {

    const city = (await params).cidade;
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Companions in {capitalizedCity}</h1>
            <Suspense fallback={<CompanionsListSkeleton />}>
                <CompanionsList city={city} />
            </Suspense>
        </div>
    );
}