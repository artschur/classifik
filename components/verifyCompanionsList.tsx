'use client';

import { useEffect, useState } from 'react';
import SingleCompanionVerify from './singleComponentVerify';
import type { RegisterCompanionFormValues } from './formCompanionRegister';
import { CompanionFiltered } from '@/types/types';

type Companion = RegisterCompanionFormValues & { id: number; cityName: string };

/** Impressão digital dos dados de um cartão: muda quando o servidor devolve dados novos. */
function assinatura(companion: CompanionFiltered): string {
  const texto = JSON.stringify(companion);
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return `${texto.length}-${h}`;
}

export default function VerifyCompanionsList({
  initialCompanions,
}: {
  initialCompanions: CompanionFiltered[];
}) {
  const [companions, setCompanions] =
    useState<CompanionFiltered[]>(initialCompanions);

  // Depois de uma edição (ou de qualquer acção que revalide a página) o
  // servidor devolve os dados novos. Sem isto, os cartões ficavam com o nome,
  // a descrição e as fotos de antes de editar até recarregar a página.
  useEffect(() => {
    setCompanions(initialCompanions);
  }, [initialCompanions]);

  const handleActionComplete = (companionId: number) => {
    setCompanions((prevCompanions) =>
      prevCompanions.filter((companion) => companion.id !== companionId)
    );
  };

  return (
    <div className="flex flex-col w-full items-center space-y-8">
      {companions.map((companion) => (
        <SingleCompanionVerify
          // A chave inclui os dados: um cartão com dados novos recomeça do
          // zero, e os outros mantêm o que o admin já estava a ver.
          key={`${companion.id}-${assinatura(companion)}`}
          onActionComplete={() => handleActionComplete(companion.id)}
          companion={companion}
        />
      ))}
      {companions.length === 0 && (
        <p className="text-lg text-center text-gray-500">
          Não há mais sugars para verificar.
        </p>
      )}
    </div>
  );
}
