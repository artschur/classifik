import { kv } from '@/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    await kv.set('cron:ping', Date.now());
    return Response.json({ ok: true });
}
