import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { getAvailableCities } from "@/db/queries";
import { checkEmailExists, getEmail } from "@/db/queries/userActions";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function RegisterCompanionPage() {
  const [cities, email] = await Promise.all([getAvailableCities(), getEmail()]);

  const emailAvailable = !(await checkEmailExists(email));
  if (!emailAvailable) {
    redirect("/profile");
  }

  return (
    <div className="container mx-auto py-8 md:px-0">
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterCompanionForm cities={cities} />
      </Suspense>
    </div>
  );
}
