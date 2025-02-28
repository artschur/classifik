import { db } from "@/db";
import { getCompanionByClerkId } from "@/db/queries/companions";
import { analyticsEventsTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const companionInfo = await getCompanionByClerkId(userId);
        if (!companionInfo) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get("days") || "30");
        console.log("Days:", days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get page view stats
        const pageViews = await db
            .select({
                total: sql<number>`count(*)`,
                unique: sql<number>`count(distinct ${analyticsEventsTable.ip_hash})`,
            })
            .from(analyticsEventsTable)
            .where(
                sql`${analyticsEventsTable.companion_id} = ${companionInfo.id}
            AND ${analyticsEventsTable.event_type} = 'page_view'
            AND ${analyticsEventsTable.created_at} >= ${startDate.toISOString()}`
            );

        // Get WhatsApp click stats
        const whatsappClicks = await db
            .select({
                total: sql<number>`count(*)`,
            })
            .from(analyticsEventsTable)
            .where(
                sql`${analyticsEventsTable.companion_id} = ${companionInfo.id} 
            AND ${analyticsEventsTable.event_type} = 'whatsapp_click'
            AND ${analyticsEventsTable.created_at} >= ${startDate.toISOString()}`
            );

        const dailyViews = await db
            .select({
                date: sql<string>`date_trunc('day', ${analyticsEventsTable.created_at})::date`,
                count: sql<number>`count(*)`,
            })
            .from(analyticsEventsTable)
            .where(
                sql`${analyticsEventsTable.companion_id} = ${companionInfo.id} 
            AND ${analyticsEventsTable.event_type} = 'page_view'
            AND ${analyticsEventsTable.created_at} >= ${startDate.toISOString()}`
            )
            .groupBy(sql`date_trunc('day', ${analyticsEventsTable.created_at})::date`)
            .orderBy(sql`date_trunc('day', ${analyticsEventsTable.created_at})::date`);

        return NextResponse.json({
            pageViews: {
                total: pageViews[0]?.total || 0,
                unique: pageViews[0]?.unique || 0,
            },
            whatsappClicks: whatsappClicks[0]?.total || 0,
            dailyViews,
            companionId: companionInfo.id,
        });
    } catch (error) {
        console.error("[ANALYTICS_GET_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}