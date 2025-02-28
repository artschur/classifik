import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEventsTable } from "@/db/schema";
import { createHash } from "crypto";


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { companion_id, event_type, metadata = {} } = body;

        if (!companion_id || !event_type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const ipHash = createHash("sha256").update(ip).digest("hex");

        const userAgent = req.headers.get("user-agent") || "";

        await db.insert(analyticsEventsTable).values({
            companionId: companion_id,
            event_type,
            metadata,
            ip_hash: ipHash,
            user_agent: userAgent,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ANALYTICS_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}