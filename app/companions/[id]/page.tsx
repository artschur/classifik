import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCompanionById, getReviewsByCompanionId } from "@/db/queries";
import CompanionReviews from "@/components/companionReviews";
import { Suspense } from "react";
import { ReviewsSkeleton } from "@/components/skeletons/skeletonReview";
import SingleCompanionComponent from "@/components/singleCompanion";
import { CompanionSkeleton } from "@/components/skeletons/skeletonSingleCompanion";

export default async function SingleCompanionPage({ params }: { params: { id: string; }; }) {
    const id = Number.parseInt(params.id);
    const companions = await getCompanionById(id);
    const companion = companions[0];



    return (
        <div className="container mx-auto py-8 px-4 md:px-0">
            <Suspense fallback={<CompanionSkeleton />}>
                <SingleCompanionComponent id={id} />
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <CompanionReviews id={id} />
            </Suspense>
        </div>
    );
}

