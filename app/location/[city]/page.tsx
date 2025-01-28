import { Suspense } from "react";
import { getCompanionsToFilter } from "@/db/queries";
import CompanionFilters from "@/components/companionFilters";
import type { CompanionFiltered } from "@/db/types";
import { CompanionsListSkeleton } from "@/components/companionsList";

export default async function CompanionsPage({ params, }: { params: Promise<{ city: string; }>; }) {
    const city = (await params).city;
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).replaceAll("-", " ");

    let companions: CompanionFiltered[] = [];
    let error = null;

    try {
        companions = await getCompanionsToFilter(city);
    } catch (e) {
        error = e instanceof Error ? e.message : "An error occurred while fetching companions";
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
            <h1 className="text-3xl font-bold mb-6">Companions in {capitalizedCity}</h1>
            <Suspense fallback={<CompanionsListSkeleton />}>
                <CompanionFilters companions={companions} />
            </Suspense>
        </div>
    );
}

