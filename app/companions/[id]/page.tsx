import CompanionReviews from "@/components/companionReviews";
import SingleCompanionPage from "@/components/singleCompanion";
import { ReviewsSkeleton } from "@/components/skeletons/skeletonReview";
import { CompanionSkeleton } from "@/components/skeletons/skeletonSingleCompanion";
import { Suspense } from "react";

export default async function CompanionPage({ params }: { params: { id: string; }; }) {
    const id = await parseInt(params.id);

    return (
        <div>
            <h1>As melhores acompanhantes</h1>
            <Suspense fallback={<CompanionSkeleton />}>
                <SingleCompanionPage id={id} />
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <CompanionReviews id={id} />
            </Suspense>

        </div>
    );
}

