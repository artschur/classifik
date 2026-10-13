import type { Candidate } from '@/db/queries/candidates';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { CandidatePhotos } from '@/components/candidate-photos';
import { CandidateActions } from '@/components/candidate-actions';

const STATUS_LABEL: Record<Candidate['status'], string> = {
  candidato: 'Por contactar',
  contactado: 'Contactada',
  autorizado: 'Autorizou',
  publicado: 'Publicada',
  recusado: 'Recusou',
};

/**
 * Candidata importada, como o admin a vê na fila do /verify. As fotos são
 * cópias no bucket privado "candidatas"; só passam para o site se ela
 * autorizar e for publicada.
 */
export function CandidateCard({
  candidate: c,
  cities,
}: {
  candidate: Candidate;
  cities: { id: number; city: string }[];
}) {
  const [idadeMin, idadeMax] = (c.idadeTexto ?? '').split('/');
  const whatsapp = `https://wa.me/${c.telefone.replace(/\D/g, '')}`;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{STATUS_LABEL[c.status]}</Badge>
          {c.distrito && <Badge variant="outline">{c.distrito}</Badge>}
          {c.pontuacao !== null && <Badge variant="outline">Pontuação {c.pontuacao}</Badge>}
          {c.flags.map((flag) => (
            <Badge key={flag} className="bg-amber-600 text-white hover:bg-amber-600">
              {flag}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-lg leading-snug">{c.nomeAnuncio}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Título do anúncio, não o nome dela.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
        >
          <MessageCircle className="h-4 w-4" />
          {c.telefone}
        </a>

        <CandidatePhotos fotos={c.fotos.map((f) => f.url)} guardadas={c.fotosGuardadas} />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Item
            label="Idade"
            value={idadeMin ? `${idadeMin}–${idadeMax ?? '?'} (escalão do anúncio)` : null}
          />
          <Item label="Nacionalidade" value={c.nacionalidade} />
          <Item label="Idiomas" value={c.idiomas.join(', ')} />
          <Item label="Horário" value={c.horario} />
          <Item label="Altura" value={c.altura} />
          <Item label="Peso" value={c.peso} />
          <Item label="Olhos" value={c.olhos} />
          <Item label="Local" value={[c.zona, c.cidade].filter(Boolean).join(', ')} />
        </dl>

        {c.descricao && (
          <p className="whitespace-pre-line break-words text-sm text-muted-foreground">
            {c.descricao}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Origem: {c.origens.join(', ') || 'desconhecida'}
          {c.nFontes > 1 && ` (${c.nFontes} sites)`}
        </p>

        <CandidateActions candidate={c} cities={cities} />
      </CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}
