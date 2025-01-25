import { SelectCidadesCadastradas } from "@/components/selectCidades";
import { getAvailableCities } from "@/db/queries";

export default async function LocationsPage() {
    const cities = await getAvailableCities();
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Our Locations</h1>
            <SelectCidadesCadastradas cities={cities} />
        </div>
    );
}