import { SelectCidadesCadastradas } from "@/components/selectCidades";
import { getAvailableCitiesSummary } from "@/db/queries";

export default async function LocationsPage() {
    const cities = await getAvailableCitiesSummary();
    return (
        <div className="flex flex-col justify-center items-center px-4 py-8 w-full h-full">
            <div className="flex flex-col items-left justify-center gap-x-4 min-h-[80vh]">
                <h1 className="text-3xl flex font-bold mb-6 px-2">Our Locations</h1>
                <SelectCidadesCadastradas cities={cities} />
            </div>
        </div>
    );
}