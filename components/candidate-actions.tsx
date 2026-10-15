'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Candidate } from '@/db/queries/candidates';
import {
  approvalSchema,
  CANAIS_CONSENTIMENTO,
  CORES_CABELO,
  CORES_OLHOS,
  ETNIAS,
  IDIOMAS,
} from '@/lib/candidate-approval';
import {
  approveCandidate,
  markCandidateContacted,
  registerCandidateConsent,
  rejectCandidate,
  saveCandidateDraft,
} from '@/app/actions/candidates';

type City = { id: number; city: string };
type Resultado = { success: boolean; error?: string };

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

/**
 * Botões de uma candidata no /verify: editar o perfil (rascunho), marcar
 * contactada, registar consentimento, aprovar e recusar.
 */
export function CandidateActions({ candidate: c, cities }: { candidate: Candidate; cities: City[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aberto, setAberto] = useState<'consentimento' | 'editar' | 'aprovar' | 'recusar' | null>(null);

  const correr = (acao: () => Promise<Resultado>, ok: string, fechar = true) =>
    startTransition(async () => {
      const res = await acao();
      if (res.success) {
        toast({ title: ok, variant: 'success' });
        if (fechar) setAberto(null);
        router.refresh();
      } else {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' });
      }
    });

  const autorizou = c.status === 'autorizado';

  return (
    <div className="space-y-3 border-t pt-4">
      {autorizou && c.consentimentoEm && (
        <p className="text-xs text-green-600">
          Consentimento registado a {new Date(c.consentimentoEm).toLocaleDateString('pt-PT')}.
        </p>
      )}
      {c.rascunho && (
        <p className="text-xs text-blue-600">
          Perfil preparado{c.rascunho.name ? ` como "${c.rascunho.name}"` : ''}, por publicar.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => setAberto('editar')}>
          Editar
        </Button>
        {c.status === 'candidato' && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => correr(() => markCandidateContacted(c.id), 'Marcada como contactada')}
          >
            Marcar contactada
          </Button>
        )}
        {!autorizou && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={() => setAberto('consentimento')}>
            Registar consentimento
          </Button>
        )}
        <Button size="sm" disabled={isPending} onClick={() => setAberto('aprovar')}>
          Publicar
        </Button>
        <Button variant="destructive" size="sm" disabled={isPending} onClick={() => setAberto('recusar')}>
          Recusar
        </Button>
      </div>

      <ConsentDialog
        aberto={aberto === 'consentimento'}
        onFechar={() => setAberto(null)}
        isPending={isPending}
        onConfirmar={(dados) => correr(() => registerCandidateConsent(c.id, dados), 'Consentimento registado')}
      />

      {/* Sempre montado, só aberto ou fechado: desmontar um diálogo do Radix
          enquanto está aberto deixava a página inteira sem receber cliques. */}
      <ProfileDialog
          aberto={aberto === 'editar' || aberto === 'aprovar'}
          modo={aberto === 'aprovar' ? 'aprovar' : 'editar'}
          candidate={c}
          cities={cities}
          isPending={isPending}
          onFechar={() => setAberto(null)}
          onGuardar={(dados) => correr(() => saveCandidateDraft(c.id, dados), 'Rascunho guardado')}
          podePorNoAr={autorizou}
          onPublicar={(dados) =>
            correr(
              () => approveCandidate(c.id, dados),
              (dados as { publishPaused?: boolean }).publishPaused
                ? 'Perfil criado em pausa: está em "Publicadas", com o link para lhe enviar'
                : 'Perfil publicado',
            )
          }
        />

      <AlertDialog open={aberto === 'recusar'} onOpenChange={(o) => !o && setAberto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar esta candidata?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados dela e as fotos guardadas são apagados de vez. Use quando ela disser que não
              quer estar no site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                correr(() => rejectCandidate(c.id), 'Candidata recusada e apagada');
              }}
            >
              Recusar e apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ConsentDialog({
  aberto,
  onFechar,
  onConfirmar,
  isPending,
}: {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (dados: { canal: string; notas: string }) => void;
  isPending: boolean;
}) {
  const [canal, setCanal] = useState<string>('whatsapp');
  const [notas, setNotas] = useState('');

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar consentimento</DialogTitle>
          <DialogDescription>
            Confirme que ela autorizou ter o perfil na OneSugar. Fica registado quando, por onde e por
            quem.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="canal">Por onde autorizou</Label>
            <select id="canal" className={selectClass} value={canal} onChange={(e) => setCanal(e.target.value)}>
              {CANAIS_CONSENTIMENTO.map((c) => (
                <option key={c} value={c}>
                  {{ whatsapp: 'WhatsApp', chamada: 'Chamada', sms: 'SMS', email: 'Email', outro: 'Outro' }[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex.: aceitou por mensagem, prefere ser contactada à tarde"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirmar({ canal, notas })} disabled={isPending}>
            Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ProfileProps = {
  modo: 'editar' | 'aprovar';
  candidate: Candidate;
  cities: City[];
  isPending: boolean;
  /** Consentimento já registado: o botão "no ar" não precisa de o confirmar. */
  podePorNoAr: boolean;
  onFechar: () => void;
  onGuardar: (dados: unknown) => void;
  onPublicar: (dados: unknown) => void;
};

/**
 * O perfil que vai ser publicado. No modo "editar" só guarda o rascunho; no
 * modo "aprovar" também publica.
 *
 * O formulário vive dentro do conteúdo do diálogo, que o Radix desmonta ao
 * fechar: cada vez que abre, recomeça do rascunho guardado e do anúncio.
 */
function ProfileDialog({ aberto, ...props }: ProfileProps & { aberto: boolean }) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && props.onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <ProfileForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({
  modo,
  candidate: c,
  cities,
  isPending,
  podePorNoAr,
  onFechar,
  onGuardar,
  onPublicar,
}: ProfileProps) {
  const p = c.prefill;
  const r = c.rascunho ?? {};
  const todas = c.fotos.map((f) => f.path);
  const urlDe = new Map(c.fotos.map((f) => [f.path, f.url]));

  const [form, setForm] = useState({
    name: r.name ?? '',
    phone: r.phone ?? c.telefone,
    age: r.age ?? p.age?.toString() ?? '',
    cityId: r.cityId ?? p.cityId?.toString() ?? '',
    price: r.price ?? '',
    ethnicity: r.ethnicity ?? '',
    hairColor: r.hairColor ?? '',
    eyeColor: r.eyeColor ?? p.eyeColor ?? '',
    height: r.height ?? p.height?.toString() ?? '',
    weight: r.weight ?? p.weight?.toString() ?? '',
    languages: (r.languages ?? (p.languages.length ? p.languages : ['Português'])) as string[],
    shortDescription: r.shortDescription ?? '',
    description: r.description ?? p.description,
    meetsAtHotel: r.meetsAtHotel ?? false,
    meetsAtOwnPlace: r.meetsAtOwnPlace ?? false,
    // Ordem escolhida: a primeira é a capa. Sem rascunho, todas pela ordem do anúncio.
    photos: (r.photos?.filter((path) => urlDe.has(path)) ?? todas) as string[],
  });
  const [erro, setErro] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const alternar = (lista: string[], valor: string) =>
    lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor];
  const mover = (indice: number, passo: number) => {
    const fotos = [...form.photos];
    const destino = indice + passo;
    if (destino < 0 || destino >= fotos.length) return;
    [fotos[indice], fotos[destino]] = [fotos[destino], fotos[indice]];
    set('photos', fotos);
  };
  const deFora = todas.filter((path) => !form.photos.includes(path));

  const guardar = () => onGuardar(form);

  // Só se valida o obrigatório (descrição, fotos, WhatsApp) e o que estiver
  // preenchido; o que ficar vazio fica por completar.
  const publicar = (emPausa: boolean) => {
    const parsed = approvalSchema.safeParse({ ...form, publishPaused: emPausa });
    if (!parsed.success) {
      setErro(parsed.error.issues[0]?.message ?? 'Verifique os campos');
      return;
    }
    setErro(null);
    onPublicar(parsed.data);
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>{modo === 'aprovar' ? 'Publicar perfil' : 'Editar perfil'}</DialogTitle>
          <DialogDescription>
            Obrigatórios: descrição, fotos e WhatsApp (*). O resto pode ficar vazio até ela completar o
            registo. O perfil fica sem o selo &quot;Verificada&quot;, que só chega com o documento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nome a mostrar">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={c.nomeAnuncio.slice(0, 60)}
            />
            <p className="text-xs text-muted-foreground">Se ficar vazio, usa o título do anúncio.</p>
          </Campo>
          <Campo label="WhatsApp *">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+351 9…" />
          </Campo>
          <Campo label="Idade">
            <Input type="number" min={18} value={form.age} onChange={(e) => set('age', e.target.value)} />
            {c.idadeTexto && (
              <p className="text-xs text-muted-foreground">
                Faixa do anúncio: {c.idadeTexto.replace('/', '–')}
              </p>
            )}
          </Campo>
          <Campo label="Distrito">
            <select className={selectClass} value={form.cityId} onChange={(e) => set('cityId', e.target.value)}>
              <option value="">Escolha…</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.city}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Local do anúncio: {[c.zona, c.cidade].filter(Boolean).join(', ') || '—'}
            </p>
          </Campo>
          <Campo label="Preço por hora (€)">
            <Input type="number" min={1} value={form.price} onChange={(e) => set('price', e.target.value)} />
          </Campo>
          <Campo label="Etnia">
            <Opcoes valor={form.ethnicity} opcoes={ETNIAS} onChange={(v) => set('ethnicity', v)} />
          </Campo>
          <Campo label="Cor do cabelo">
            <Opcoes valor={form.hairColor} opcoes={CORES_CABELO} onChange={(v) => set('hairColor', v)} />
          </Campo>
          <Campo label="Cor dos olhos">
            <Opcoes valor={form.eyeColor} opcoes={CORES_OLHOS} onChange={(v) => set('eyeColor', v)} vazio="Sem informação" />
          </Campo>
          <Campo label="Altura (m)">
            <Input value={form.height} onChange={(e) => set('height', e.target.value)} placeholder="1,65" />
          </Campo>
          <Campo label="Peso (kg)">
            <Input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
          </Campo>
          <Campo label="Idiomas" className="sm:col-span-2">
            <div className="flex flex-wrap gap-4">
              {IDIOMAS.map((idioma) => (
                <label key={idioma} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.languages.includes(idioma)}
                    onCheckedChange={() => set('languages', alternar(form.languages, idioma))}
                  />
                  {idioma}
                </label>
              ))}
            </div>
          </Campo>
          <Campo label="Descrição curta (opcional, até 150)" className="sm:col-span-2">
            <Input
              maxLength={150}
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
            />
          </Campo>
          <Campo label="Descrição *" className="sm:col-span-2">
            <Textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Campo>
          <div className="flex flex-wrap gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.meetsAtHotel} onCheckedChange={(v) => set('meetsAtHotel', v === true)} />
              Atende em hotel
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.meetsAtOwnPlace} onCheckedChange={(v) => set('meetsAtOwnPlace', v === true)} />
              Atende em local próprio
            </label>
          </div>

          <Campo label={`Fotos no perfil * (${form.photos.length})`} className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              A primeira é a capa. Use as setas para mudar a ordem; toque numa foto para a tirar.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {form.photos.map((path, i) => (
                <div key={path} className="relative">
                  <button
                    type="button"
                    onClick={() => set('photos', form.photos.filter((x) => x !== path))}
                    className="block w-full overflow-hidden rounded-md border-2 border-rose-500"
                    title="Tirar do perfil"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado temporário */}
                    <img src={urlDe.get(path)} alt="" className="aspect-[3/4] w-full object-cover" />
                  </button>
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Capa
                    </span>
                  )}
                  <div className="mt-1 flex justify-between">
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0} onClick={() => mover(i, -1)}>
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={i === form.photos.length - 1}
                      onClick={() => mover(i, 1)}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {deFora.length > 0 && (
              <>
                <p className="mt-2 text-xs text-muted-foreground">Fora do perfil (toque para juntar no fim):</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {deFora.map((path) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => set('photos', [...form.photos, path])}
                      className="overflow-hidden rounded-md border-2 border-transparent opacity-50 hover:opacity-100"
                      title="Juntar ao perfil"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado temporário */}
                      <img src={urlDe.get(path)} alt="" className="aspect-[3/4] w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </Campo>

          {modo === 'aprovar' && (
            <p className="rounded-md border p-3 text-xs text-muted-foreground sm:col-span-2">
              <span className="font-medium text-foreground">Em pausa</span>: ninguém o encontra no site;
              depois de publicar tem o link de pré-visualização e o convite para lhe enviar.{' '}
              <span className="font-medium text-foreground">No ar</span>: visível para todos. Ao publicar
              assim, confirma que ela autorizou por WhatsApp, e isso fica registado com a data e o seu nome.
            </p>
          )}
        </div>

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant={modo === 'aprovar' ? 'outline' : 'default'} onClick={guardar} disabled={isPending}>
            Guardar
          </Button>
          {modo === 'aprovar' && (
            <>
              <Button variant="outline" onClick={() => publicar(true)} disabled={isPending}>
                {isPending ? 'A publicar…' : 'Publicar em pausa'}
              </Button>
              {/* O texto do botão é a confirmação: carregar regista que ela
                  autorizou por WhatsApp, se ainda não houver registo. */}
              <Button onClick={() => publicar(false)} disabled={isPending}>
                {podePorNoAr ? 'Publicar no ar' : 'Publicar no ar · autorizou por WhatsApp'}
              </Button>
            </>
          )}
        </DialogFooter>
    </>
  );
}

function Campo({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Opcoes({
  valor,
  opcoes,
  onChange,
  vazio = 'Escolha…',
}: {
  valor: string;
  opcoes: readonly string[];
  onChange: (v: string) => void;
  vazio?: string;
}) {
  return (
    <select className={selectClass} value={valor} onChange={(e) => onChange(e.target.value)}>
      <option value="">{vazio}</option>
      {opcoes.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
