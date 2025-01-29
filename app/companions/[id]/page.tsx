import CompanionReviews from "@/components/companionReviews";
import { Suspense } from "react";
import { ReviewsSkeleton } from "@/components/skeletons/skeletonReview";
import SingleCompanionComponent from "@/components/singleCompanion";
import { CompanionSkeleton } from "@/components/skeletons/skeletonSingleCompanion";

export default async function SingleCompanionPage(params: { params: Promise<{ id: string; }>; }) {
    const { id } = await (await params).params;

    return (
        <div className="container mx-auto py-8 md:px-0">
            <Suspense fallback={<CompanionSkeleton />}>
                <SingleCompanionComponent id={parseInt(id)} />
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <CompanionReviews id={parseInt(id)} />
            </Suspense>
        </div>
    );
}

