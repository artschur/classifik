'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateInvite } from '@/app/actions/candidates';

/**
 * Os dois links que o admin envia a uma candidata cujo perfil criou:
 * - pré-visualização, para ela ver o perfil mesmo em pausa;
 * - convite, para ela criar conta e ficar com o perfil.
 *
 * Usado na secção "Publicadas" das importadas, no separador "Em pausa" e nos
 * controlos de admin da página do perfil.
 */
export function ImportedShareButtons({
  companionId,
  previewPath,
  temConvite = false,
}: {
  companionId: number;
  previewPath: string;
  temConvite?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [convite, setConvite] = useState<string | null>(null);

  const copiar = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast({ title: ok, variant: 'success' });
    } catch {
      toast({ title: 'Copie o link', description: texto });
    }
  };

  const gerarConvite = () =>
    startTransition(async () => {
      const res = await generateInvite(companionId);
      if (!res.success) {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' });
        return;
      }
      const link = `${window.location.origin}${res.path}`;
      setConvite(link);
      await copiar(link, temConvite ? 'Novo convite copiado. O anterior deixou de funcionar.' : 'Convite copiado');
      router.refresh();
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copiar(`${window.location.origin}${previewPath}`, 'Link de pré-visualização copiado')}
        >
          <Copy className="h-4 w-4" /> Copiar pré-visualização
        </Button>
        <Button variant="outline" size="sm" disabled={isPending} onClick={gerarConvite}>
          <Copy className="h-4 w-4" /> {temConvite ? 'Gerar novo convite' : 'Gerar convite para registo'}
        </Button>
      </div>
      {convite && (
        <div className="flex gap-2">
          <Input readOnly value={convite} onFocus={(e) => e.target.select()} className="text-xs" />
          <Button variant="outline" size="sm" onClick={() => copiar(convite, 'Convite copiado')}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
