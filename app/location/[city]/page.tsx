import { Suspense } from "react";
import type { CompanionFiltered } from "@/types/types";
import { CompanionsListSkeleton } from "@/components/companionsList";
import { getCompanionsToFilter } from "@/db/queries/companions";
import { CompanionFilters } from "@/components/companionFilters";
import { FilterTypesCompanions } from "@/types/types";


export default async function CompanionsPage({
    params,
    searchParams
}: {
    params: Promise<{ city: string; }>;
    searchParams: Promise<FilterTypesCompanions>;
}) {
    const { city } = await params;
    const sParams = await searchParams;
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).replaceAll("-", " ");

    let companions: CompanionFiltered[] = [];
    let error = null;


    try {
        companions = await getCompanionsToFilter(city, {
            ...sParams,
        });

    } catch (e) {
        error = e instanceof Error ? e.message : "An error occurred";
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                <p>Error: {error}</p>
            </div>
        );
    }

    if (companions.length === 0) {
        return (
            <div className="text-center text-gray-500 p-4">
                <p>No companions found.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">Companions in {capitalizedCity}</h1>
            <Suspense fallback={<CompanionsListSkeleton />}>
                <CompanionFilters companions={companions} city={city} currentFilters={sParams} />
            </Suspense>
        </div>
    );
}

