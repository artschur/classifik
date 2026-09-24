'use client';

import { useRef, useState, useTransition } from 'react';
import { ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setStoryCoverAction } from '@/app/actions/admin-stories';

/**
 * Troca a imagem de capa de um conto já publicado, a partir da lista.
 *
 * Os contos não têm ecrã de edição: sem isto, mudar a capa obrigava a apagar
 * o conto e a voltar a escrevê-lo todo.
 */
export function ChangeCoverButton({
  storyId,
  slug,
}: {
  storyId: number;
  slug: string;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [trocada, setTrocada] = useState(false);

  const aoEscolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('storyId', String(storyId));
    fd.append('slug', slug);
    fd.append('coverImage', file);

    startTransition(async () => {
      const r = await setStoryCoverAction(fd);

      // Permite escolher o mesmo ficheiro outra vez depois de uma falha: sem
      // isto o input guarda o valor e não dispara novo evento.
      if (inputRef.current) inputRef.current.value = '';

      if (!r.success) {
        toast({
          title: 'Erro',
          description: r.error ?? 'Não foi possível trocar a capa.',
          variant: 'destructive',
        });
        return;
      }

      setTrocada(true);
      toast({
        title: 'Capa trocada',
        description: 'A imagem nova já está no conto.',
        variant: 'success',
      });
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={aoEscolher}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Escolher uma nova imagem de capa para este conto"
      >
        <ImageIcon className="h-4 w-4" />
        {isPending ? 'A enviar...' : trocada ? 'Capa trocada' : 'Trocar capa'}
      </button>
    </>
  );
}
