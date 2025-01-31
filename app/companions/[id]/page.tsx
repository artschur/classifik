import CompanionReviews from "@/components/companionReviews";
import { Suspense } from "react";
import { ReviewsSkeleton } from "@/components/skeletons/skeletonReview";
import SingleCompanionComponent from "@/components/singleCompanion";
import { CompanionSkeleton } from "@/components/skeletons/skeletonSingleCompanion";
import { getCompanionById } from "@/db/queries";
import { CompanionById } from "@/db/types";
import { getReviewsByCompanionId } from "@/db/queries";
import { Review } from "@/db/schema";


export default async function SingleCompanionPage(params: { params: Promise<{ id: string; }>; }) {
    const { id } = await (await params).params;
    const companion: CompanionById = await getCompanionById(parseInt(id));
    const reviews: Review[] = await getReviewsByCompanionId(parseInt(id));
    const countReviews: number = reviews.length;
    return (
        <div className="container py-8 mx-auto md:px-0">
            <Suspense fallback={<CompanionSkeleton />}>
                <SingleCompanionComponent companion={companion} countReviews={countReviews} />
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <CompanionReviews reviews={reviews} />
            </Suspense>
        </div>
    );
}

