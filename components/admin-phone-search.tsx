'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, MessageCircle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ResultadoBusca, ResultadoPerfil } from '@/lib/admin-phone-search';

type Resposta =
  | { success: true; resultados: ResultadoBusca[]; limitado: boolean }
  | { success: false; error: string };

const ESTADO_CANDIDATA: Record<string, string> = {
  candidato: 'Por contactar',
  contactado: 'Contactada',
  autorizado: 'Autorizou',
  recusado: 'Recusou',
};

/** Onde o perfil está, e em que separador do /verify se trata dele. */
function estadoPerfil(p: ResultadoPerfil): { texto: string; onde: string | null; className: string } {
  if (p.recusado) {
    return { texto: 'Recusado', onde: 'Recusadas', className: 'bg-red-100 text-red-900 hover:bg-red-100' };
  }
  if (!p.aprovado) {
    return { texto: 'Por aprovar', onde: 'Registos', className: 'bg-amber-100 text-amber-900 hover:bg-amber-100' };
  }
  if (p.pausado && p.estadoImportacao === 'reivindicado') {
    return {
      texto: 'Reivindicada, em pausa à espera de aprovação',
      onde: 'Registos',
      className: 'bg-violet-100 text-violet-900 hover:bg-violet-100',
    };
  }
  if (p.pausado && p.importadaSemConta) {
    return {
      texto: 'Importada sem conta, em pausa',
      onde: 'Em pausa',
      className: 'bg-slate-200 text-slate-900 hover:bg-slate-200',
    };
  }
  if (p.pausado) {
    return { texto: 'Em pausa', onde: 'Em pausa', className: 'bg-slate-200 text-slate-900 hover:bg-slate-200' };
  }
  return { texto: 'No ar', onde: null, className: 'bg-green-100 text-green-900 hover:bg-green-100' };
}

const whatsapp = (telefone: string) => `https://wa.me/${telefone.replace(/\D/g, '')}`;

/**
 * Busca de admin por telefone: perfis em qualquer estado e candidatas
 * importadas ainda sem perfil.
 */
export function AdminPhoneSearch() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null);
  const [limitado, setLimitado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aProcurar, startTransition] = useTransition();

  const procurar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      let res: Resposta;
      try {
        const r = await fetch(`/api/admin/phone-search?tel=${encodeURIComponent(termo)}`, {
          cache: 'no-store',
        });
        res = (await r.json()) as Resposta;
      } catch {
        res = { success: false, error: 'Não foi possível procurar. Tente outra vez.' };
      }
      if (!res.success) {
        setErro(res.error);
        setResultados(null);
        return;
      }
      setResultados(res.resultados);
      setLimitado(res.limitado);
    });
  };

  const limpar = () => {
    setTermo('');
    setResultados(null);
    setErro(null);
  };

  return (
    <div className="w-full max-w-2xl space-y-3 rounded-lg border p-4">
      <form onSubmit={procurar} className="flex gap-2">
        <Input
          type="search"
          inputMode="tel"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Procurar por telefone (ex.: 925 801 096)"
          aria-label="Telefone"
        />
        <Button type="submit" disabled={aProcurar}>
          <Search className="mr-1.5 h-4 w-4" />
          {aProcurar ? 'A procurar…' : 'Procurar'}
        </Button>
        {resultados && (
          <Button type="button" variant="ghost" size="icon" onClick={limpar} aria-label="Limpar">
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      {resultados && resultados.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum perfil nem candidata com este número.
        </p>
      )}

      {resultados && resultados.length > 0 && (
        <ul className="space-y-2">
          {resultados.map((r) =>
            r.tipo === 'perfil' ? (
              <LinhaPerfil key={`p-${r.id}`} perfil={r} />
            ) : (
              <li key={`c-${r.id}`} className="space-y-1 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.nome}</span>
                  <Badge variant="outline">Candidata sem perfil</Badge>
                  <Badge variant="secondary">{ESTADO_CANDIDATA[r.estado] ?? r.estado}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {r.telefone}
                  {r.distrito && ` · ${r.distrito}`} · separador Importadas
                </p>
                <a
                  href={whatsapp(r.telefone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </li>
            ),
          )}
        </ul>
      )}

      {limitado && (
        <p className="text-xs text-muted-foreground">
          Há mais resultados: escreva mais dígitos para afinar.
        </p>
      )}
    </div>
  );
}

function LinhaPerfil({ perfil: p }: { perfil: ResultadoPerfil }) {
  const estado = estadoPerfil(p);
  return (
    <li className="space-y-1 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{p.nome}</span>
        <span className="text-xs text-muted-foreground">#{p.id}</span>
        <Badge className={estado.className}>{estado.texto}</Badge>
        <Badge variant="outline">{p.selo ? 'Verificada' : 'Não verificada'}</Badge>
        {p.alteracoesPorRever && (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Alterações por rever</Badge>
        )}
      </div>
      <p className="text-muted-foreground">
        {p.telefone}
        {p.cidade && ` · ${p.cidade}`}
        {p.email && ` · ${p.email}`}
        {estado.onde && ` · separador ${estado.onde}`}
      </p>
      {p.recusado && p.motivoRecusa && (
        <p className="text-muted-foreground">Motivo da recusa: {p.motivoRecusa}</p>
      )}
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/companions/${p.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Ver perfil
        </Link>
        <a
          href={whatsapp(p.telefone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-green-600 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </div>
    </li>
  );
}
