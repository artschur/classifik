import { SelectCidadesCadastradas } from "@/components/selectCidades";
import { getAvailableCitiesSummary } from "@/db/queries";
import { Suspense } from "react";

export default async function LocationsPage() {
    const cities = await getAvailableCitiesSummary();
    return (
        <div className="flex flex-col justify-center items-center px-4 py-8 w-full h-full">
            <div className="flex flex-col items-left justify-center gap-x-4 min-h-[80vh]">
                <h1 className="text-3xl flex font-bold mb-6 px-2">Nossas localizações</h1>
                <Suspense fallback={
                    [0, 1, 2, 3, 4, 5].map(() => (
                        <div
                            className='h-12 w-52 bg-neutral-200 animate-pulse rounded-md'>
                        </div>
                    ))}
                >
                    <SelectCidadesCadastradas cities={cities} />
                </Suspense>
            </div>
        </div >
    );
}