import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { getAvailableCities } from "@/db/queries";

export default async function RegisterCompanionPage() {
    const cities = await getAvailableCities();
    console.log(cities);
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Register yourself in the best platform</h1>
            <RegisterCompanionForm cities={cities} />
        </div>
    );
}