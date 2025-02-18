import { eq } from "drizzle-orm";
import { db } from "..";
import { Review, reviewsTable } from "../schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { assert } from "console";

interface ReviewResponse {
    id: number;
    author: string;
    comment: string;
    likes: number | null;
    rating: number;
    created_at: Date | null;
}

export async function getReviewsByCompanionId(id: number): Promise<ReviewResponse[]> {
    return await db
        .select({
            id: reviewsTable.id,
            author: reviewsTable.username,
            comment: reviewsTable.comment,
            likes: reviewsTable.likes,
            rating: reviewsTable.rating,
            created_at: reviewsTable.created_at,
        }
        )
        .from(reviewsTable)
        .where(eq(reviewsTable.companion_id, id));
};

export async function insertReview({ companion_id, clerkId, comment, rating }: { companion_id: number, clerkId: string, comment: string, rating: number; }) {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkId);
    const username = user.username;
    if (!username) {
        throw new Error('Username not found');
    }
    return await db
        .insert(reviewsTable)
        .values({
            companion_id: companion_id,
            username: username,
            user_id: clerkId,
            rating: rating,
            comment: comment
        });
}