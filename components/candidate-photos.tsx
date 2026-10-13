'use client';

import { useState } from 'react';

const MAX_VISIVEIS = 12;

/**
 * Fotos de uma candidata, copiadas para o bucket privado "candidatas" e
 * servidas por endereços assinados que expiram ao fim de uma hora.
 *
 * Uma foto que falhe (endereço expirado com a página aberta muito tempo, ou
 * ficheiro apagado) sai da grelha em vez de ficar partida.
 */
export function CandidatePhotos({
  fotos,
  guardadas,
}: {
  fotos: string[];
  guardadas: boolean;
}) {
  const [partidas, setPartidas] = useState<Set<string>>(new Set());

  if (!guardadas) {
    return (
      <p className="text-xs text-muted-foreground">
        As fotos desta candidata ainda não foram copiadas para o nosso armazenamento.
      </p>
    );
  }

  const boas = fotos.filter((src) => !partidas.has(src));
  if (boas.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sem fotos guardadas.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {boas.slice(0, MAX_VISIVEIS).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- endereços assinados e temporários, sem passar pelo optimizador
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="aspect-[3/4] w-full rounded-md object-cover bg-muted"
            onError={() => setPartidas((anterior) => new Set(anterior).add(src))}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {boas.length > MAX_VISIVEIS ? `${MAX_VISIVEIS} de ${boas.length} fotos` : `${boas.length} fotos`}
      </p>
    </div>
  );
}
