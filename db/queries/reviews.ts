"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "..";
import { reviewsTable } from "../schema";
import { auth, clerkClient } from "@clerk/nextjs/server";

export interface ReviewResponse {
    id: number;
    author: string;
    comment: string;
    likes: number;
    rating: number;
    created_at: Date | null;
    userLiked: boolean;
    userImageUrl: string | null;
}

export async function getReviewsByCompanionId(id: number): Promise<ReviewResponse[]> {
    const { userId } = (await auth());
    return await db
        .select({
            id: reviewsTable.id,
            author: reviewsTable.username,
            comment: reviewsTable.comment,
            likes: sql<number>`COALESCE(array_length(${reviewsTable.liked_by}, 1), 0)`,
            rating: reviewsTable.rating,
            created_at: reviewsTable.created_at,
            userLiked: sql<boolean>`${userId} = ANY(${reviewsTable.liked_by})`,
            userImageUrl: reviewsTable.userImageUrl,
        })
        .from(reviewsTable)
        .where(eq(reviewsTable.companion_id, id));
};

export async function insertReview({ companion_id, clerkId, comment, rating }: { companion_id: number, clerkId: string, comment: string, rating: number; }): Promise<ReviewResponse> {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkId);
    const username = user.username || user.firstName || 'Anonymous';
    if (!username) {
        throw new Error('Username not found');
    }

    const [inserted] = await db
        .insert(reviewsTable)
        .values({
            companion_id: companion_id,
            username: username,
            user_id: clerkId,
            rating: Math.round(rating),
            comment: comment,
            userImageUrl: user.imageUrl,
        })
        .returning({
            id: reviewsTable.id,
            author: reviewsTable.username,
            comment: reviewsTable.comment,
            likes: sql`0`,
            rating: reviewsTable.rating,
            created_at: reviewsTable.created_at,
            userImageUrl: reviewsTable.userImageUrl,
        });

    return inserted as ReviewResponse;
}

export async function likeReview(reviewId: number, clerkId: string) {
    const existingLike = await db
        .select({ id: reviewsTable.id })
        .from(reviewsTable)
        .where(
            and(
                sql`${reviewsTable.liked_by} @> ARRAY[${clerkId}]::text[]`,
                (eq(reviewsTable.id, reviewId))
            )
        )
        .limit(1);

    if (existingLike.length > 0) {
        throw new Error('User has already liked this review');
    }
    return await db
        .update(reviewsTable)
        .set({
            liked_by: sql`ARRAY_APPEND(COALESCE(${reviewsTable.liked_by}, ARRAY[]::text[]), ${clerkId})`
        })
        .where(eq(reviewsTable.id, reviewId));
}

export async function unlikeReview(reviewId: number, clerkId: string) {
    console.log("interacted");
    const existingLike = await db
        .select({ id: reviewsTable.id })
        .from(reviewsTable)
        .where(
            and(
                sql`${reviewsTable.liked_by} @> ARRAY[${clerkId}]::text[]`,
                (eq(reviewsTable.id, reviewId))
            )
        )
        .limit(1);

    if (existingLike.length === 0) {
        throw new Error('User has not liked this review');
    }

    await db.update(reviewsTable)
        .set({
            liked_by: sql`ARRAY_REMOVE(${reviewsTable.liked_by}, ${clerkId})`
        })
        .where(eq(reviewsTable.id, reviewId));
}