import Link from "next/link";
import { ISimpleCompanion } from "@/db/types";
import { getSimpleCompanions } from "@/db/queries";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function CompanionsList() {

    const companions = await getSimpleCompanions();
    // Disable caching for this component

    return (
        <>
            {companions.map((companions: ISimpleCompanion) => (
                <Link
                    key={companions.id}
                    href={`${companions.id}`}
                    className="flex flex-col text-white gap-4 p-4 border border-gray-200 rounded-lg shadow-md"
                >
                    <h2 className="text-2xl font-semibold">{companions.name}</h2>
                    <p className="text-base">{companions.description}</p>
                    <p className="text-base">R$ {companions.price}</p>
                </Link>
            ))}
        </>
    );
}

