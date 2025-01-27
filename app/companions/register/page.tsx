import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { getAvailableCities } from "@/db/queries";

export default async function RegisterCompanionPage() {
    const cities = await getAvailableCities();
    console.log(cities);
    return (
        <div className="container mx-auto py-8 md:px-0">
            <RegisterCompanionForm cities={cities} />
        </div>
    );
}