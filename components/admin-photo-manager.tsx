'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  deleteImage,
  getImagesForAdmin,
  updateImageFramingAsAdmin,
  updateImagesOrderAsAdmin,
  uploadImageAsAdmin,
  type AdminImage,
} from '@/db/queries/images';
import { PhotoSortableGrid, type ManagedImage } from '@/components/photoSortableGrid';
import { ImageFramingDialog } from '@/components/imageFramingDialog';
import { DEFAULT_FRAMING, type Framing } from '@/lib/image-framing';

/**
 * Fotos de um anúncio geridas pelo admin, na página do perfil: juntar,
 * substituir, apagar, reordenar e enquadrar. Serve para qualquer perfil,
 * tenha ou não conta da dona. O que o admin junta entra já aprovado.
 */
export function AdminPhotoManager({ companionId, name }: { companionId: number; name: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [fotos, setFotos] = useState<AdminImage[]>([]);
  const [aCarregar, startCarregar] = useTransition();
  const [aEnviar, setAEnviar] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<string | null>(null);
  // Ref e não estado: o seletor de ficheiros abre fora do React, e o alvo tem
  // de estar lá quando ele devolver o ficheiro.
  const aSubstituir = useRef<string | null>(null);
  const [enquadrar, setEnquadrar] = useState<ManagedImage | null>(null);
  const [aGravarEnquadramento, setAGravarEnquadramento] = useState(false);
  const juntarRef = useRef<HTMLInputElement>(null);
  const substituirRef = useRef<HTMLInputElement>(null);
  const mudou = useRef(false);

  const erro = (descricao: string) =>
    toast({ title: 'Erro', description: descricao, variant: 'destructive' });

  const abrir = () =>
    startCarregar(async () => {
      const res = await getImagesForAdmin(companionId);
      if (!res.success) {
        erro(res.error);
        return;
      }
      setFotos(res.images);
      mudou.current = false;
      setAberto(true);
    });

  // A página por trás só é actualizada ao fechar, para não recarregar o
  // perfil a cada foto enquanto o admin ainda está a trabalhar.
  const fechar = (open: boolean) => {
    setAberto(open);
    if (!open && mudou.current) router.refresh();
  };

  const juntar = async (ficheiros: File[]) => {
    if (!ficheiros.length) return;
    let falhas = 0;
    for (const [i, ficheiro] of ficheiros.entries()) {
      setAEnviar(`A enviar ${i + 1} de ${ficheiros.length}…`);
      const res = await uploadImageAsAdmin(ficheiro, companionId);
      if (res.success) {
        setFotos((atual) => [...atual, res.image]);
        mudou.current = true;
      } else {
        falhas++;
      }
    }
    setAEnviar(null);
    if (falhas) erro(`${falhas} de ${ficheiros.length} ficheiros não foram enviados.`);
    else toast({ title: 'Fotos juntadas', description: 'Já estão no anúncio.', variant: 'success' });
  };

  const substituir = async (ficheiro: File | undefined) => {
    const alvo = aSubstituir.current;
    aSubstituir.current = null;
    if (!ficheiro || !alvo) return;
    setAEnviar('A substituir…');
    const res = await uploadImageAsAdmin(ficheiro, companionId, alvo);
    setAEnviar(null);
    if (!res.success) {
      erro(res.error);
      return;
    }
    setFotos((atual) => atual.map((f) => (f.storagePath === alvo ? res.image : f)));
    mudou.current = true;
    toast({ title: 'Foto substituída', variant: 'success' });
  };

  const apagar = async () => {
    const alvo = aApagar;
    setAApagar(null);
    if (!alvo) return;
    try {
      await deleteImage(alvo);
      setFotos((atual) => atual.filter((f) => f.storagePath !== alvo));
      mudou.current = true;
    } catch {
      erro('Não foi possível apagar a foto.');
    }
  };

  const reordenar = async (nova: ManagedImage[]) => {
    const anterior = fotos;
    const porCaminho = new Map(fotos.map((f) => [f.storagePath, f]));
    setFotos(nova.map((f) => porCaminho.get(f.storagePath)!));
    const res = await updateImagesOrderAsAdmin(
      companionId,
      nova.map((f) => f.storagePath),
    );
    if (!res.success) {
      setFotos(anterior);
      erro(res.error ?? 'Não foi possível gravar a ordem.');
      return;
    }
    mudou.current = true;
  };

  const gravarEnquadramento = async (framing: Framing) => {
    if (!enquadrar) return;
    setAGravarEnquadramento(true);
    const res = await updateImageFramingAsAdmin(enquadrar.storagePath, framing);
    setAGravarEnquadramento(false);
    if (!res.success) {
      erro(res.error ?? 'Não foi possível gravar o enquadramento.');
      return;
    }
    setFotos((atual) =>
      atual.map((f) => (f.storagePath === enquadrar.storagePath ? { ...f, ...framing } : f)),
    );
    mudou.current = true;
    setEnquadrar(null);
  };

  const ocupado = aEnviar !== null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={abrir} disabled={aCarregar}>
        <ImageIcon className="h-4 w-4 mr-1.5" />
        {aCarregar ? 'A abrir…' : 'Gerir fotos'}
      </Button>

      {/* Sempre montado, só aberto ou fechado: desmontar um diálogo do Radix
          enquanto está aberto deixava a página sem receber cliques. */}
      <Dialog open={aberto} onOpenChange={fechar}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fotos de {name}</DialogTitle>
            <DialogDescription>
              A primeira é a capa. Arraste para mudar a ordem. Em cada foto:
              enquadrar (canto superior esquerdo), substituir (ao lado) e apagar
              (canto superior direito). O que juntar ou substituir aparece logo
              no anúncio, sem passar pela verificação.
            </DialogDescription>
          </DialogHeader>

          {fotos.length > 0 ? (
            <PhotoSortableGrid
              images={fotos}
              selected={new Set()}
              onToggleSelect={() => {}}
              onReorder={reordenar}
              onRequestDelete={(caminho) => setAApagar(caminho)}
              onEditFraming={(foto) => setEnquadrar(foto)}
              onReplace={(foto) => {
                if (ocupado) return;
                aSubstituir.current = foto.storagePath;
                substituirRef.current?.click();
              }}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Este anúncio ainda não tem fotos.
            </p>
          )}

          <input
            ref={juntarRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const ficheiros = Array.from(e.target.files ?? []);
              e.target.value = '';
              void juntar(ficheiros);
            }}
          />
          <input
            ref={substituirRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const ficheiro = e.target.files?.[0];
              e.target.value = '';
              void substituir(ficheiro);
            }}
          />

          <DialogFooter className="gap-2 sm:justify-between">
            <Button onClick={() => juntarRef.current?.click()} disabled={ocupado}>
              {ocupado ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> {aEnviar}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" /> Juntar fotos
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => fechar(false)} disabled={ocupado}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={aApagar !== null} onOpenChange={(open) => !open && setAApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Sai do anúncio e é apagada de vez. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={apagar}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageFramingDialog
        open={enquadrar !== null}
        onOpenChange={(open) => !open && setEnquadrar(null)}
        imageUrl={enquadrar?.publicUrl ?? null}
        initialFraming={
          enquadrar
            ? {
                focalX: enquadrar.focalX ?? DEFAULT_FRAMING.focalX,
                focalY: enquadrar.focalY ?? DEFAULT_FRAMING.focalY,
                zoom: enquadrar.zoom ?? DEFAULT_FRAMING.zoom,
              }
            : DEFAULT_FRAMING
        }
        isSaving={aGravarEnquadramento}
        onSave={gravarEnquadramento}
      />
    </>
  );
}
