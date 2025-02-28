'use server';

import { auth } from "@clerk/nextjs/server";
import { db } from "..";
import { analyticsEventsTable } from "../schema";
import { and, eq, sql, SQL } from "drizzle-orm";
import { unique } from "drizzle-orm/mysql-core";

export type AnalyticsEvents = 'page_view' | 'whatsapp_click' | 'instagram_click' | 'image_view' | 'review_click';

export interface SelfAnalyticsResponse {
    perfil: {
        total: number;
        unique: number;
    };
    whatsapp: {
        total: number;
        conversionRate: number;
    };
    dailyViews: {
        date: string;
        count: number;
    }[];
    instagram: {
        total: number;
        conversionRate: number;
    };
}


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
    days, companionId
}: {
    days: number;
    companionId: number;
}): Promise<SelfAnalyticsResponse> {

    const conditions: SQL[] = [
        eq(analyticsEventsTable.companionId, companionId),
        sql`${analyticsEventsTable.created_at} > current_date - ${days}::integer`];

    const totalPageViews = db
        .select({
            total: sql<number>`count(*)`,
            unique: sql<number>`count(distinct ${analyticsEventsTable.ip_hash})`,
        })
        .from(analyticsEventsTable)
        .where(and(...conditions));

    const whatsappClicks = db.select({
        total: sql<number>`count(*)`,
        unique: sql<number>`count(distinct ${analyticsEventsTable.ip_hash})`,
    }).from(analyticsEventsTable)
        .where(
            and(
                ...conditions,
                eq(analyticsEventsTable.event_type, 'whatsapp_click')
            )
        );

    const instagramClicks = db.select({
        total: sql<number>`count(*)`,
        unique: sql<number>`count(distinct ${analyticsEventsTable.ip_hash})`,
    }).from(analyticsEventsTable)
        .where(
            and(
                ...conditions,
                eq(analyticsEventsTable.event_type, 'instagram_click')
            )
        );

    const dailyViews = db
        .select({
            date: sql<string>`date_trunc('day', ${analyticsEventsTable.created_at})::date`,
            count: sql<number>`count(*)`,
        })
        .from(analyticsEventsTable)
        .where(
            and(
                ...conditions,
                eq(analyticsEventsTable.event_type, 'page_view')
            )
        )
        .groupBy(sql`date_trunc('day', ${analyticsEventsTable.created_at})::date`)
        .orderBy(sql`date_trunc('day', ${analyticsEventsTable.created_at})::date`);

    const [pageViews, whatsapp, instagram, dailyViewsResult] = await Promise.all([
        totalPageViews,
        whatsappClicks,
        instagramClicks,
        dailyViews
    ]);

    return {
        perfil: {
            total: pageViews[0]?.total || 0,
            unique: pageViews[0]?.unique || 0,
        },
        whatsapp: {
            total: whatsapp[0]?.total || 0,
            conversionRate: whatsapp[0]?.total / pageViews[0]?.total || 0,
        },
        instagram: {
            total: instagram[0]?.total || 0,
            conversionRate: instagram[0]?.total / pageViews[0]?.total || 0,
        },
        dailyViews: dailyViewsResult
    };
}