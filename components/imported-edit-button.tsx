'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { CORES_CABELO, CORES_OLHOS, ETNIAS, IDIOMAS, adminEditSchema } from '@/lib/candidate-approval';
import { AdminPhotoManager } from '@/components/admin-photo-manager';
import {
  getImportedProfileForEdit,
  updateImportedProfile,
  type ImportedProfileForEdit,
} from '@/app/actions/candidates';
import { Campo, Opcoes, selectClass } from '@/components/candidate-actions';

/**
 * "Editar" e "Gerir fotos" de admin, lado a lado, para qualquer perfil. É o
 * par a usar nas páginas de admin (fila, em pausa, recusadas, perfil).
 */
export function AdminEditButtons({ companionId, name }: { companionId: number; name: string }) {
  return (
    <>
      <ImportedEditButton companionId={companionId} />
      <AdminPhotoManager companionId={companionId} name={name} />
    </>
  );
}

/**
 * Botão "Editar" do admin, para qualquer perfil: nome, contacto, idade,
 * distrito, preço, características, idiomas e descrições. Nos importados,
 * também as fotos com o arquivo; nos outros as fotos mudam-se no "Gerir
 * fotos". Separado de pôr no ar ou pausar, que têm botões próprios.
 */
export function ImportedEditButton({ companionId }: { companionId: number }) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState<ImportedProfileForEdit | null>(null);
  const [aCarregar, startCarregar] = useTransition();

  const abrir = () =>
    startCarregar(async () => {
      const res = await getImportedProfileForEdit(companionId);
      if (!res.success) {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' });
        return;
      }
      setDados(res.data);
      setAberto(true);
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={abrir} disabled={aCarregar}>
        <Pencil className="mr-1.5 h-4 w-4" />
        {aCarregar ? 'A abrir…' : 'Editar'}
      </Button>
      {/* Sempre montado, só aberto ou fechado: desmontar um diálogo do Radix
          enquanto está aberto deixava a página sem receber cliques. */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {dados && (
            <EditForm
              key={JSON.stringify(dados.photos)}
              companionId={companionId}
              dados={dados}
              onFechar={() => setAberto(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditForm({
  companionId,
  dados,
  onFechar,
}: {
  companionId: number;
  dados: ImportedProfileForEdit;
  onFechar: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...dados.values, photos: dados.photos.map((f) => f.key) });
  const [erro, setErro] = useState<string | null>(null);

  const urlDe = new Map([...dados.photos, ...dados.archived].map((f) => [f.key, f.url]));
  const deFora = [...dados.photos, ...dados.archived].map((f) => f.key).filter((k) => !form.photos.includes(k));

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

  // Sem arquivo (perfis que não são importados), as fotos não vão no pedido:
  // mudam-se no "Gerir fotos", que também acrescenta e substitui.
  const envio = dados.fotosNoEditor ? form : { ...form, photos: undefined };

  // Valores antigos fora das listas (ex.: "Castanho" nos olhos) continuam a
  // aparecer, para não se perderem ao guardar.
  const comAtual = (lista: readonly string[], atual: string) =>
    atual && !lista.includes(atual) ? [...lista, atual] : lista;
  const idiomas = [...IDIOMAS, ...form.languages.filter((l) => !(IDIOMAS as readonly string[]).includes(l))];

  const guardar = () => {
    const parsed = adminEditSchema.safeParse(envio);
    if (!parsed.success) {
      setErro(parsed.error.issues[0]?.message ?? 'Verifique os campos');
      return;
    }
    setErro(null);
    startTransition(async () => {
      const res = await updateImportedProfile(companionId, envio);
      if (res.success) {
        toast({ title: 'Perfil actualizado', variant: 'success' });
        onFechar();
        router.refresh();
      } else {
        setErro(res.error ?? 'Não foi possível guardar');
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>
          Obrigatórios (*): nome, WhatsApp, idade, distrito e descrição
          {dados.fotosNoEditor ? ', e pelo menos uma foto' : ''}. Guardar não muda se o perfil está no
          ar ou em pausa.
          {!dados.fotosNoEditor && ' Para acrescentar, trocar ou tirar fotos, use "Gerir fotos".'}
        </DialogDescription>
      </DialogHeader>

      {dados.edicaoPendente && (
        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
          Ela tem alterações por rever: está a editar a proposta dela, já com essas alterações. O que
          guardar aqui vai para o ar quando a aprovar.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nome a mostrar *">
          <Input value={form.name} maxLength={100} onChange={(e) => set('name', e.target.value)} />
        </Campo>
        <Campo label="WhatsApp *">
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+351 9… (ou +55…)" />
        </Campo>
        <Campo label="Idade *">
          <Input type="number" min={18} value={form.age} onChange={(e) => set('age', e.target.value)} />
        </Campo>
        <Campo label="Distrito *">
          <select className={selectClass} value={form.cityId} onChange={(e) => set('cityId', e.target.value)}>
            <option value="">Escolha…</option>
            {dados.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.city}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Preço por hora (€)">
          <Input type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} />
        </Campo>
        <Campo label="Etnia">
          <Opcoes valor={form.ethnicity} opcoes={comAtual(ETNIAS, dados.values.ethnicity)} onChange={(v) => set('ethnicity', v)} />
        </Campo>
        <Campo label="Cor do cabelo">
          <Opcoes valor={form.hairColor} opcoes={comAtual(CORES_CABELO, dados.values.hairColor)} onChange={(v) => set('hairColor', v)} />
        </Campo>
        <Campo label="Cor dos olhos">
          <Opcoes
            valor={form.eyeColor}
            opcoes={comAtual(CORES_OLHOS, dados.values.eyeColor)}
            onChange={(v) => set('eyeColor', v)}
            vazio="Sem informação"
          />
        </Campo>
        <Campo label="Altura (m)">
          <Input value={form.height} onChange={(e) => set('height', e.target.value)} placeholder="1,65" />
        </Campo>
        <Campo label="Peso (kg)">
          <Input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
        </Campo>
        <Campo label="Idiomas" className="sm:col-span-2">
          <div className="flex flex-wrap gap-4">
            {idiomas.map((idioma) => (
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

        {dados.fotosNoEditor && (
        <Campo label={`Fotos no perfil * (${form.photos.length})`} className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">
            A primeira é a capa. Use as setas para mudar a ordem; toque numa foto para a tirar. As fotos
            tiradas ficam guardadas em privado e podem voltar.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {form.photos.map((key, i) => (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => set('photos', form.photos.filter((x) => x !== key))}
                  className="block w-full overflow-hidden rounded-md border-2 border-rose-500"
                  title="Tirar do perfil"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura simples */}
                  <img src={urlDe.get(key)} alt="" className="aspect-[3/4] w-full object-cover" />
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
              <p className="mt-2 text-xs text-muted-foreground">
                Guardadas fora do perfil (toque para juntar no fim):
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {deFora.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('photos', [...form.photos, key])}
                    className="overflow-hidden rounded-md border-2 border-transparent opacity-50 hover:opacity-100"
                    title="Juntar ao perfil"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- endereço assinado temporário */}
                    <img src={urlDe.get(key)} alt="" className="aspect-[3/4] w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </Campo>
        )}
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onFechar} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={isPending}>
          {isPending ? 'A guardar…' : 'Guardar'}
        </Button>
      </DialogFooter>
    </>
  );
}
