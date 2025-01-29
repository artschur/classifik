import { Suspense } from "react";
import CompanionFilters from "@/components/companionFilters";
import type { CompanionFiltered } from "@/db/types";
import { CompanionsListSkeleton } from "@/components/companionsList";
import { getCompanionsToFilter } from "@/db/queries/companions";

export default async function CompanionsPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ city: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const { city } = await params;
    const sParams = await searchParams;
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).replaceAll("-", " ");

    let companions: CompanionFiltered[] = [];
    let error = null;

    const filters = {
        price: sParams.price,
        age: sParams.age,
        sort: sParams.sort
    };

    try {
        companions = await getCompanionsToFilter(city, {
            price: sParams.price ?? '',
            age: sParams.age ?? '',
            sort: sParams.sort ?? ''
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
                <CompanionFilters companions={companions} city={city} />
            </Suspense>
        </div>
    );
}

