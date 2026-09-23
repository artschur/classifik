'use client';

import { useState, useTransition } from 'react';
import { Link2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { setStoryCompanionAction } from '@/app/actions/admin-stories';
import { CompanionPicker, type DistrictOption } from './companion-picker';

/**
 * Liga um conto já publicado ao perfil de uma acompanhante, a partir da
 * lista. Os contos não têm ecrã de edição, e sem isto só os contos novos
 * poderiam ser ligados.
 */
export function LinkCompanionButton({
  storyId,
  companionId,
  companionName,
  options,
}: {
  storyId: number;
  companionId: number | null;
  companionName: string | null;
  options: DistrictOption[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [ligada, setLigada] = useState(companionName);

  const guardar = (formData: FormData) => {
    const valor = formData.get('companionId') as string;
    const novo = valor ? Number(valor) : null;

    startTransition(async () => {
      const r = await setStoryCompanionAction(storyId, novo);
      if (!r.success) {
        toast({
          title: 'Erro',
          description: r.error ?? 'Não foi possível guardar.',
          variant: 'destructive',
        });
        return;
      }

      const nome = novo
        ? (options
          .flatMap((o) => o.companions)
          .find((c) => c.id === novo)?.name ?? null)
        : null;
      setLigada(nome);
      setAberto(false);
      toast({
        title: nome ? 'Perfil ligado' : 'Ligação removida',
        description: nome
          ? `O conto passa a apontar para ${nome}.`
          : 'O conto deixa de apontar para um perfil.',
        variant: 'success',
      });
    });
  };

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Ligar este conto ao perfil de uma acompanhante"
      >
        <Link2 className="h-4 w-4" />
        {ligada ?? 'Ligar perfil'}
      </button>
    );
  }

  return (
    <form action={guardar} className="w-full max-w-md space-y-3 rounded-lg border p-3">
      <CompanionPicker options={options} initialCompanionId={companionId} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          <Check className="h-4 w-4 mr-1.5" /> Guardar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setAberto(false)}
          disabled={isPending}
        >
          <X className="h-4 w-4 mr-1.5" /> Cancelar
        </Button>
      </div>
    </form>
  );
}
