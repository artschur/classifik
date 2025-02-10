'use client';

import { useState } from 'react';
import SingleCompanionVerify from './singleComponentVerify';
import type { RegisterCompanionFormValues } from './formCompanionRegister';

type Companion = RegisterCompanionFormValues & { id: number; cityName: string };

export default function VerifyCompanionsList({
  initialCompanions,
}: {
  initialCompanions: Companion[];
}) {
  const [companions, setCompanions] = useState<Companion[]>(initialCompanions);

  const handleActionComplete = (companionId: number) => {
    setCompanions((prevCompanions) =>
      prevCompanions.filter((companion) => companion.id !== companionId)
    );
  };

  return (
    <div className="flex flex-col w-full items-center space-y-8">
      {companions.map((companion) => (
        <SingleCompanionVerify
          companion={companion}
          key={companion.id}
          onActionComplete={() => handleActionComplete(companion.id)}
        />
      ))}
      {companions.length === 0 && (
        <p className="text-lg text-center text-gray-500">
          Não há mais acompanhantes para verificar.
        </p>
      )}
    </div>
  );
}
