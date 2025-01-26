import CompanionReviews from "@/components/companionReviews";
import SingleCompanionPage from "@/components/singleCompanion";
import { ReviewsSkeleton } from "@/components/skeletons/skeletonReview";
import { CompanionSkeleton } from "@/components/skeletons/skeletonSingleCompanion";
import { Suspense } from "react";


type Params = Promise<{ id: string; }>;

export default async function CompanionPage(props: { params: Params; }) {
    let { id } = await props.params;

    return (
        <div>
            <h1>As melhores acompanhantes</h1>
            <Suspense fallback={<CompanionSkeleton />}>
                <SingleCompanionPage id={parseInt(id)} />
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <CompanionReviews id={parseInt(id)} />
            </Suspense>

        </div>
    );
}

