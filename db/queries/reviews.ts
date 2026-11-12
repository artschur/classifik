"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "..";
import { reviewsTable } from "../schema";
import { auth, clerkClient } from "@clerk/nextjs/server";

export interface ReviewResponse {
    id: number;
    companionId: number;
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
            companionId: reviewsTable.companion_id,
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

/**
 * A conta sai sempre da sessão: este ficheiro é 'use server', e com o id como
 * parâmetro qualquer pessoa escrevia avaliações (ou dava gostos) em nome de
 * outra, com o nome e a foto dela.
 */
async function contaDaSessao(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error('Inicie sessão para continuar.');
    return userId;
}

export async function insertReview({ companion_id, comment, rating }: { companion_id: number, comment: string, rating: number; }): Promise<ReviewResponse> {
    const clerkId = await contaDaSessao();
    const texto = String(comment ?? '').trim().slice(0, 2000);
    if (!texto) throw new Error('Escreva um comentário.');
    const nota = Math.min(5, Math.max(1, Math.round(Number(rating) || 0)));
    if (!Number.isInteger(companion_id) || companion_id <= 0) throw new Error('Perfil inválido.');

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
            rating: nota,
            comment: texto,
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

export async function likeReview(reviewId: number) {
    const clerkId = await contaDaSessao();
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

export async function unlikeReview(reviewId: number) {
    const clerkId = await contaDaSessao();
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