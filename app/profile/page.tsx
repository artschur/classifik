import { getCompanionById } from "@/db/queries";
import { getCompanionByClerkId } from "@/db/queries/companions";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CompanionProfilePage() {
    
    const userId : string | null = (await auth()).userId;
    if (!userId) {
        redirect("/");
    }

    const companionInfo = await getCompanionByClerkId(userId);
    return (
        <div className="container mx-auto py-8 md:px-0">
            <h1>Profile</h1>
            <SignedIn>
                <p>Profile content goes here</p>
                {companionInfo.name}
            </SignedIn>
            <SignedOut>
                <p>You must be signed in to view this page</p>
            </SignedOut>
            
        </div>
    );
}