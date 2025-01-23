import { getCompanions, getSimpleCompanions } from "@/db/queries";
import { Companion } from "@/db/schema";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

async function CompanionsList() {
  'use client';
  // receber um array simples de acompanhantes, so pra mostrar na pag principal
  const acompanhantes: { id: number, name: string, price: number, verified: boolean | null, description: string, age: number; }[] = await getSimpleCompanions();

  return (
    <>
      {acompanhantes.map((acompanhante) => (
        <Link href={`${acompanhante.id}`} className="flex flex-col text-white gap-4 p-4 border border-gray-200 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold">{acompanhante.name}</h2>
          <p className="text-base">{acompanhante.description}</p>
          <p className="text-base">R$ {acompanhante.price}</p>
        </Link>
      ))}
    </>
  );
}


export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Suspense fallback={
          <div className="flex items-center justify-center w-full">
            <div className="animate-pulse space-y-4 w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg w-full" />
              ))}
            </div>
          </div>
        }>
          <CompanionsList />
        </Suspense>
      </main>
    </div>
  );
}