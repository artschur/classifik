'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';

export type DistrictOption = {
  district: string;
  companions: { id: number; name: string }[];
};

/**
 * Escolha em dois passos: primeiro o distrito, depois a acompanhante desse
 * distrito. A lista completa seria uma caixa com dezenas de nomes sem
 * contexto nenhum; por distrito, quem publica encontra quem procura.
 *
 * A ligação é opcional — sem escolha, o conto fica como está hoje.
 */
export function CompanionPicker({
  options,
  initialCompanionId = null,
  name = 'companionId',
  onChange,
}: {
  options: DistrictOption[];
  initialCompanionId?: number | null;
  name?: string;
  /**
   * Para quem monta o FormData à mão a partir do estado, em vez de deixar o
   * formulário ler o campo escondido.
   */
  onChange?: (companionId: number | null) => void;
}) {
  const distritoInicial =
    options.find((o) => o.companions.some((c) => c.id === initialCompanionId))
      ?.district ?? '';

  const [district, setDistrict] = useState(distritoInicial);
  const [companionId, setCompanionId] = useState<string>(
    initialCompanionId ? String(initialCompanionId) : '',
  );

  const daqui = options.find((o) => o.district === district)?.companions ?? [];

  const escolher = (valor: string) => {
    setCompanionId(valor);
    onChange?.(valor ? Number(valor) : null);
  };

  const selectClasses =
    'w-full h-10 rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${name}-distrito`}>Distrito</Label>
        <select
          id={`${name}-distrito`}
          className={selectClasses}
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            // A escolha anterior é de outro distrito e deixaria de fazer
            // sentido ao lado do novo.
            escolher('');
          }}
        >
          <option value="">Sem ligação</option>
          {options.map((o) => (
            <option key={o.district} value={o.district}>
              {o.district} ({o.companions.length})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${name}-companion`}>Acompanhante</Label>
        <select
          id={`${name}-companion`}
          className={selectClasses}
          value={companionId}
          onChange={(e) => escolher(e.target.value)}
          disabled={!district}
        >
          <option value="">
            {district ? 'Escolher...' : 'Escolha o distrito primeiro'}
          </option>
          {daqui.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name={name} value={companionId} />
    </div>
  );
}
