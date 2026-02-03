import { clerkClient, createClerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const payload = await req.json();
  const eventType = payload.type;

  if (eventType === "user.created") {
    const { id } = payload.data;
    const client = await clerkClient();

    await client.users.updateUserMetadata(id, {
      publicMetadata: {
        hasUploadedDocs: false,
      },
    });
  }

  return new Response("", { status: 200 });
}
