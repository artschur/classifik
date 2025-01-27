import { getReviewsByCompanionId } from "@/db/queries";

export default async function CompanionReviews({ id }: { id: number; }) {
    const reviews = await getReviewsByCompanionId(id);

    return (
        <div className="w-full pt-8">
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            {reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 mb-4 shadow rounded">
                    <h3 className="text-lg font-bold">{review.user_id}</h3>
                    <p className="text-sm text-gray-500">{review.comment}</p>
                </div>
            ))}
        </div>
    );
};