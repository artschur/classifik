import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { getAvailableCities } from "@/db/queries";
import { getCompanionByClerkId, getCompanionToEdit } from "@/db/queries/companions";
import { checkEmailExists, getEmail } from "@/db/queries/userActions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function RegisterCompanionPage() {
    
    const { userId } = (await auth()) 
    if (!userId) {
        redirect("/");
    }

    const [cities, email, companion] = await Promise.all([getAvailableCities(), getEmail(), getCompanionToEdit(userId)]);

  const emailAvailable = !(await checkEmailExists(email));
  if (!emailAvailable) {
    redirect("/profile");
  }

  return (
    <div className="container mx-auto py-8 md:px-0">
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterCompanionForm cities={cities} companionData={companion} />
      </Suspense>
    </div>
  );
}
