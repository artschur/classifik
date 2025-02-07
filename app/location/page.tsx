import { SelectCidadesCadastradas } from "@/components/selectCidades";
import { getAvailableCitiesSummary } from "@/db/queries";
import { Suspense } from "react";

async function CitiesList() {
    const cities = await getAvailableCitiesSummary();
    return <SelectCidadesCadastradas cities={cities} />;
}

export default function LocationsPage() {
    return (
        <div className="flex flex-col justify-center items-center px-4 py-8 w-full h-full">
            <div className="flex flex-col items-left justify-center gap-x-4 min-h-[80vh]">
                <h1 className="text-3xl flex font-bold mb-6 px-2">Nossas localizações</h1>
                <Suspense fallback={
                    <div className='flex flex-col gap-y-2'>
                        {[0, 1, 2, 3,].map((i) => (
                            <div key={i}
                                className='h-8 w-full flex flex-row bg-neutral-200 animate-pulse rounded-md'>
                            </div>
                        ))}
                    </div>}
                >
                    <CitiesList />
                </Suspense>
            </div>
        </div>
    );
}