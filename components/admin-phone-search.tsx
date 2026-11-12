'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Só os dígitos; com indicativo, os 9 do número nacional (é o que se compara). */
const soDigitos = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length > 9 ? d.slice(-9) : d;
};

/**
 * Filtro por telefone no topo do /verify. Escrever 6 dígitos ou mais (ou
 * carregar Enter) troca a página pelos cartões completos dos perfis com esse
 * número, como um Ctrl+F: o mesmo cartão da fila, com documentos, fotos,
 * edição e botões. O número vai no endereço (?tel=…), por isso o filtro
 * sobrevive a recarregar e pode ser copiado.
 */
export function AdminPhoneSearch({ inicial = '' }: { inicial?: string }) {
  const router = useRouter();
  const [termo, setTermo] = useState(inicial);
  const [aProcurar, startTransition] = useTransition();
  const ultimo = useRef(soDigitos(inicial));

  const ir = (valor: string) => {
    const d = soDigitos(valor);
    // Só procura com 6 dígitos ou mais, e só se mudou: sem isto cada tecla
    // depois do sexto dígito fazia um pedido ao servidor para o mesmo número.
    if (d.length < 6 && ultimo.current.length < 6) return;
    const alvo = d.length >= 6 ? d : '';
    if (alvo === ultimo.current) return;
    ultimo.current = alvo;
    startTransition(() => {
      router.replace(alvo ? `/verify?tel=${alvo}` : '/verify', { scroll: false });
    });
  };

  // Procura sozinho pouco depois de parar de escrever.
  useEffect(() => {
    const t = setTimeout(() => ir(termo), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ir` só usa refs e o router
  }, [termo]);

  return (
    <div className="w-full max-w-2xl space-y-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ir(termo);
        }}
        className="flex gap-2"
      >
        <Input
          type="search"
          inputMode="tel"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Filtrar por telefone (ex.: 925 801 096)"
          aria-label="Telefone"
        />
        <Button type="submit" disabled={aProcurar}>
          <Search className="mr-1.5 h-4 w-4" />
          {aProcurar ? 'A procurar…' : 'Procurar'}
        </Button>
        {termo && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Limpar"
            onClick={() => {
              setTermo('');
              ir('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
      {termo && soDigitos(termo).length < 6 && (
        <p className="text-xs text-muted-foreground">Escreva pelo menos 6 dígitos.</p>
      )}
    </div>
  );
}
