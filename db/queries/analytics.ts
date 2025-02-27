'use server';

import { auth } from "@clerk/nextjs/server";
import { db } from "..";
import { analyticsEventsTable } from "../schema";
import { and, eq, sql, SQL } from "drizzle-orm";

export type AnalyticsEvents = 'page_view' | 'whatsapp_click' | 'image_view' | 'review_click';


export async function insertAnalyticsEvent({
    companionId,
    event_type,
    metadata = {},
}: {
    companionId: number;
    event_type: AnalyticsEvents;
    metadata?: Record<string, any>;
}) {

    return await db.insert(analyticsEventsTable).values({
        companionId,
        event_type,
        metadata,
    });
}

export async function getSelfAnalytics({
    days, event_type, companionId
}: {
    days: number;
    event_type?: AnalyticsEvents;
    companionId: number;
}) {

    const conditions: SQL[] = [
        eq(analyticsEventsTable.companionId, companionId),
        sql`created_at > NOW() - INTERVAL '${days} days'`
    ];

    // if tyoe is provided, add it to the conditions
    if (event_type) {
        conditions.push(eq(analyticsEventsTable.event_type, event_type));
    }

    return await db.select().from(analyticsEventsTable).where(and(...conditions));
}

