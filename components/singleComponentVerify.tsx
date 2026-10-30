'use client';

import {
  Check,
  X,
  User,
  Phone,
  Ruler,
  Weight,
  Eye,
  Scissors,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  VideoIcon,
  Pencil,
  Crop,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useTransition } from 'react';
import {
  approveCompanion,
  rejectCompanion,
  updateCompanionAge,
  verifyIdentityAsAdmin,
} from '@/db/queries/companions';
import Image from 'next/image';
import { CompanionFiltered, Media } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevisaoIngles, type InglesEmRevisao } from '@/components/revisao-ingles';
import {
  getDocumentsByCompanionId,
  rejectDocuments,
} from '@/app/actions/document-verification';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  updateImageFramingAsAdmin,
  updateImagesOrderAsAdmin,
} from '@/db/queries/images';
import { ImageFramingDialog } from '@/components/imageFramingDialog';
import { isVideoMedia, mediaFraming, mediaUrl } from '@/lib/image-framing';

type Document = {
  id: number;
  document_type: string;
  // Endereço assinado e temporário: o bucket dos documentos é privado. Null se
  // o ficheiro já não existir no Storage.
  url: string | null;
  storage_path: string;
  verified: boolean;
  status: string;
  verification_date: string | null;
  notes: string | null;
  created_at: string;
};

// O endereço assinado termina no token, por isso a extensão vê-se no caminho.
const isPdfDocument = (doc: Document) =>
  doc.storage_path.toLowerCase().endsWith('.pdf');

const ESTADO_DOCUMENTO: Record<string, { texto: string; className: string }> = {
  aprovado: { texto: 'Aprovado', className: 'text-green-600' },
  recusado: { texto: 'Recusado', className: 'text-red-600' },
  pendente: { texto: 'Por rever', className: 'text-amber-600' },
};

const ESTADO_VERIFICACAO: Record<
  NonNullable<CompanionFiltered['verificacao']>,
  { texto: string; className: string }
> = {
  verificada: { texto: 'Verificada', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  'em-analise': { texto: 'Vídeo e documento por rever', className: 'bg-sky-100 text-sky-800 hover:bg-sky-100' },
  parcial: { texto: 'Verificação a meio', className: 'bg-amber-100 text-amber-900 hover:bg-amber-100' },
  recusada: { texto: 'Documentos recusados', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  'por-enviar': { texto: 'Sem verificação', className: 'bg-neutral-200 text-neutral-700 hover:bg-neutral-200' },
};

function haQuantoTempo(data: Date | null | undefined): string | null {
  if (!data) return null;
  const dias = Math.floor((Date.now() - new Date(data).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  return `há ${dias} dias`;
}

/**
 * Pede o motivo de uma recusa (do perfil ou dos documentos). O motivo é
 * obrigatório porque ela vê-o no painel, e vai no e-mail do RD.
 */
function DialogoMotivo({
  open,
  onOpenChange,
  titulo,
  descricao,
  botao,
  aGravar,
  onConfirmar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descricao: string;
  botao: string;
  aGravar: boolean;
  onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (!aberto) setMotivo('');
        onOpenChange(aberto);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (ela vai ver este texto)"
          maxLength={1000}
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={aGravar}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!motivo.trim() || aGravar}
            onClick={() => onConfirmar(motivo.trim())}
          >
            {botao}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SingleCompanionVerify({
  companion,
  onActionComplete,
}: {
  companion: CompanionFiltered & { description?: string; };
  onActionComplete: (companionId: number) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [age, setAge] = useState(companion.age);
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [dialogo, setDialogo] = useState<'perfil' | 'documentos' | null>(null);
  // Estado da verificação, que muda aqui mesmo quando os documentos são
  // recusados ou a identidade é verificada, sem esperar por recarregar a fila.
  const [verificacao, setVerificacao] = useState(companion.verificacao ?? 'por-enviar');
  const [completaPendente, setCompletaPendente] = useState(
    companion.verificacaoCompletaPendente === true
  );
  const [docsPendentes, setDocsPendentes] = useState(
    companion.temDocumentosPendentes === true
  );
  const [motivoDocs, setMotivoDocs] = useState(companion.motivoRecusaDocumentos ?? null);
  const [temSelo, setTemSelo] = useState(companion.identityVerified === true);
  // Versão inglesa revista no separador "Inglês". A null, a aprovação traduz sozinha.
  const [ingles, setIngles] = useState<InglesEmRevisao | null>(null);
  // Mantém o objecto em vez de reduzir ao URL, senão perdia-se o storagePath
  // e o enquadramento actual, ambos necessários para o admin poder centrar.
  // O filtro olha para a extensão do ficheiro e não só para o campo `type`,
  // porque nem todas as origens o preenchem, e um vídeo que escape aqui vai
  // parar ao <Image> e aparece como um slide em branco.
  const [images, setImages] = useState<(string | Media)[]>(() =>
    companion.images.filter(
      (media): media is string | Media => !isVideoMedia(media)
    )
  );

  const [imageToFrame, setImageToFrame] = useState<Media | null>(null);
  const [isSavingFraming, setIsSavingFraming] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  /**
   * Move a foto que está a ser vista uma posição para trás ou para a frente.
   *
   * A ordem manda no perfil: a primeira foto é a capa, que é o que decide se
   * alguém abre o anúncio. Reordenar no carrossel, enquanto se revê foto a
   * foto, é o momento natural para o fazer.
   *
   * O ecrã actualiza-se primeiro e só depois se grava; se a gravação falhar,
   * volta atrás. Evita que cada clique fique à espera do servidor.
   */
  const moveCurrentImage = async (direction: -1 | 1) => {
    const destino = currentImageIndex + direction;
    if (destino < 0 || destino >= images.length) return;

    const anterior = images;
    const nova = [...images];
    [nova[currentImageIndex], nova[destino]] = [
      nova[destino],
      nova[currentImageIndex],
    ];

    setImages(nova);
    setCurrentImageIndex(destino);
    setIsSavingOrder(true);

    const caminhos = nova
      .map((media) => (typeof media === 'object' ? media.storagePath : null))
      .filter((p): p is string => Boolean(p));

    const result = await updateImagesOrderAsAdmin(companion.id, caminhos);
    setIsSavingOrder(false);

    if (!result.success) {
      setImages(anterior);
      setCurrentImageIndex(currentImageIndex);
      toast({
        title: 'Erro',
        description: result.error ?? 'Não foi possível guardar a ordem.',
        variant: 'destructive',
      });
    }
  };

  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage ? mediaUrl(currentImage) : null;
  const canFrameCurrent =
    typeof currentImage === 'object' && Boolean(currentImage.storagePath);
  const currentImageIsNew =
    typeof currentImage === 'object' && currentImage.pendingApproval === true;

  // Um perfil que já está no ar só aparece nesta fila por causa de alterações
  // por rever, ou de vídeo e documento por ver. Recusar uma edição descarta-a;
  // não mexe na acompanhante.
  const isEdit = companion.isPendingEdit === true;
  const noAr = companion.verified === true;
  // No ar e com vídeo ou documento à espera: o admin decide o selo.
  const docsNoAr = noAr && !temSelo && docsPendentes;
  // Já esteve publicada e foi o admin que a tirou do ar.
  const wasSentToReview = companion.wasSentToReview === true && !noAr;
  const pendingChanges = companion.pendingChanges ?? [];
  const newPhotoCount = images.filter(
    (media) => typeof media === 'object' && media.pendingApproval
  ).length;
  const estadoVerificacao = ESTADO_VERIFICACAO[verificacao];
  const desde = haQuantoTempo(companion.submittedAt);

  const handleSaveFraming = async (framing: {
    focalX: number;
    focalY: number;
    zoom: number;
  }) => {
    if (!imageToFrame?.storagePath) return;

    const target = imageToFrame;
    setIsSavingFraming(true);

    const result = await updateImageFramingAsAdmin(target.storagePath!, framing);

    setIsSavingFraming(false);

    if (!result.success) {
      toast({
        title: 'Erro',
        description: result.error ?? 'Falha ao guardar o enquadramento.',
        variant: 'destructive',
      });
      return;
    }

    setImages((prev) =>
      prev.map((media) =>
        typeof media === 'object' && media.storagePath === target.storagePath
          ? { ...media, ...framing }
          : media
      )
    );
    setImageToFrame(null);
    toast({
      title: 'Enquadramento guardado',
      description: 'A foto original não foi alterada.',
      variant: 'success',
    });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  /** Corre uma acção com o aviso de erro de sempre. */
  const executar = (acao: () => Promise<void>, falha: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await acao();
      } catch (e) {
        const message = e instanceof Error && e.message ? e.message : falha;
        setError(message);
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      }
    });
  };

  /** Aprova o registo (põe no ar) ou a edição de um perfil que já está no ar. */
  const handleApprove = (comSelo: boolean) =>
    executar(async () => {
      await approveCompanion(companion.id, {
        comSelo,
        ingles: ingles && ingles.descEn.trim()
          ? {
              shortEn: ingles.shortEn,
              descEn: ingles.descEn,
              fonte: ingles.fonte,
              editada: ingles.editada,
            }
          : undefined,
      });
      toast({
        title: isEdit ? 'Alterações aprovadas' : 'Companheira aprovada',
        description: isEdit
          ? `As alterações de ${companion.name} já estão no ar.`
          : comSelo || temSelo
            ? `${companion.name} está no ar com o selo "Verificada".`
            : `${companion.name} está no ar, sem selo ("Não verificada").`,
        variant: 'success',
      });
      // Uma edição aprovada num perfil que ainda tem documentos à espera
      // continua na fila para essa decisão.
      if (isEdit && docsNoAr) return;
      onActionComplete(companion.id);
    }, 'Falha ao aprovar. Por favor, tente novamente.');

  /** Recusar uma edição no ar descarta-a (sem motivo, como sempre). */
  const handleRejectEdit = () =>
    executar(async () => {
      await rejectCompanion(companion.id);
      toast({
        title: 'Alterações recusadas',
        description: `O perfil de ${companion.name} continua no ar como estava.`,
        variant: 'success',
      });
      if (docsNoAr) return;
      onActionComplete(companion.id);
    }, 'Falha ao recusar as alterações. Por favor, tente novamente.');

  const handleRejectProfile = (motivo: string) =>
    executar(async () => {
      await rejectCompanion(companion.id, motivo);
      setDialogo(null);
      toast({
        title: 'Perfil recusado',
        description: `${companion.name} saiu da fila e vê o motivo ao entrar. Nada foi apagado: está nas Recusadas.`,
        variant: 'success',
      });
      onActionComplete(companion.id);
    }, 'Falha ao recusar o perfil. Por favor, tente novamente.');

  const handleRejectDocuments = (motivo: string) =>
    executar(async () => {
      const result = await rejectDocuments(companion.id, motivo);
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao recusar os documentos.');
      }
      setDialogo(null);
      setDocsPendentes(false);
      setCompletaPendente(false);
      setMotivoDocs(motivo);
      setVerificacao('recusada');
      setDocuments((docs) =>
        docs.map((doc) =>
          doc.status === 'pendente' ? { ...doc, status: 'recusado', verified: false, notes: motivo } : doc
        )
      );
      toast({
        title: 'Documentos recusados',
        description: noAr
          ? `${companion.name} continua no ar, sem selo. Pode enviar outros.`
          : `${companion.name} pode enviar outros. O perfil continua na fila e já pode ser aprovado sem selo.`,
        variant: 'success',
      });
      // No ar e sem edição por rever, não há mais nada a decidir aqui.
      if (noAr && !isEdit) onActionComplete(companion.id);
    }, 'Falha ao recusar os documentos. Por favor, tente novamente.');

  /** Selo para quem já está no ar e enviou vídeo e documento. */
  const handleVerifyIdentity = () =>
    executar(async () => {
      const result = await verifyIdentityAsAdmin(companion.id);
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao verificar.');
      }
      setTemSelo(true);
      setVerificacao('verificada');
      setDocsPendentes(false);
      setCompletaPendente(false);
      toast({
        title: 'Identidade verificada',
        description: `${companion.name} passou a ter o selo "Verificada".`,
        variant: 'success',
      });
      if (!isEdit) onActionComplete(companion.id);
    }, 'Falha ao verificar. Por favor, tente novamente.');

  const handleSaveAge = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateCompanionAge(companion.id, age);
        toast({
          title: 'Idade Atualizada',
          description: `A idade de ${companion.name} foi atualizada para ${age} anos.`,
          variant: 'success',
        });
        setIsEditingAge(false);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Falha ao atualizar a idade.';
        setError(message);
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        });
      }
    });
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const result = await getDocumentsByCompanionId(companion.id);
      if (result.success) {
        setDocuments(result.documents as Document[]);
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao buscar documentos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao buscar documentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [companion.id]);

  const openDocumentDialog = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDocumentDialogOpen(true);
  };

  // Special case for verification videos
  const isVerificationVideo = (doc: Document) =>
    doc.document_type === 'verification_video';

  // Extract video thumbnail if it's a verification video
  const renderDocumentPreview = (doc: Document) => {
    if (!doc.url) {
      return (
        <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    } else if (isPdfDocument(doc)) {
      return (
        <div className="bg-muted p-2 rounded">
          <FileText className="h-8 w-8" />
        </div>
      );
    } else if (isVerificationVideo(doc)) {
      return (
        <div className="h-16 w-16 relative overflow-hidden rounded bg-muted flex items-center justify-center">
          <VideoIcon className="h-8 w-8" />
          <div className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors" />
        </div>
      );
    } else {
      return (
        <div className="h-16 w-16 relative overflow-hidden rounded">
          {/* unoptimized: um documento de identidade não pode passar pelo
              optimizador de imagens, que guardaria uma cópia em cache
              acessível sem o token. */}
          <Image
            src={doc.url}
            alt={doc.document_type}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl px-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0 flex items-center gap-2 flex-wrap">
            {companion.name}
            {isEdit ? (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Edição de perfil no ar
              </Badge>
            ) : noAr ? (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                No ar: documentos por rever
              </Badge>
            ) : wasSentToReview ? (
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                Devolvida à verificação
              </Badge>
            ) : companion.recusaAnterior ? (
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                Reenviado depois de recusa
              </Badge>
            ) : (
              <Badge variant="secondary">Registo novo</Badge>
            )}
          </CardTitle>
          {companion.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{companion.phone}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge className={estadoVerificacao.className}>
            {estadoVerificacao.texto}
            {/* A via só aparece aqui, para o admin. No site o selo é igual. */}
            {verificacao === 'verificada' && companion.identityVerifiedMethod === 'whatsapp'
              ? ' (WhatsApp)'
              : ''}
          </Badge>
          {companion.semCaracteristicas && (
            <Badge variant="outline">Sem características</Badge>
          )}
          {desde && (
            <span className="text-xs text-muted-foreground">Entrou na fila {desde}</span>
          )}
        </div>
      </CardHeader>
      <Tabs defaultValue="profile" className="">
        <TabsList className="grid grid-cols-3 ">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="documents">
            Documentos ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="ingles">Inglês</TabsTrigger>
        </TabsList>

        {/* Versão inglesa (/en), revista antes de aprovar */}
        <TabsContent value="ingles">
          <CardContent>
            <RevisaoIngles companionId={companion.id} valor={ingles} onChange={setIngles} />
          </CardContent>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <CardContent className="grid gap-4">
            {companion.recusaAnterior && !noAr && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
                <span className="font-medium">Recusado antes:</span>{' '}
                {companion.recusaAnterior}
              </div>
            )}
            {motivoDocs && (verificacao === 'recusada' || verificacao === 'parcial') && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/40">
                <span className="font-medium">Documentos recusados:</span> {motivoDocs}
              </div>
            )}
            {(isEdit || pendingChanges.length > 0) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
                <p className="font-medium mb-2">
                  {isEdit
                    ? 'Este perfil está no ar. Aqui só se decide o que ela mudou.'
                    : 'Alterações por aplicar, guardadas antes de o perfil sair do ar.'}
                </p>
                {pendingChanges.length > 0 ? (
                  <ul className="space-y-1">
                    {pendingChanges.map((change) => (
                      <li key={change.label}>
                        <span className="font-medium">{change.label}:</span>{' '}
                        <span className="text-muted-foreground line-through">
                          {change.before}
                        </span>{' '}
                        <span aria-hidden>&rarr;</span>{' '}
                        <span className="font-medium">{change.after}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Sem alterações de texto.
                  </p>
                )}
                {newPhotoCount > 0 && (
                  <p className="mt-2">
                    {newPhotoCount === 1
                      ? '1 foto nova por aprovar, assinalada no carrossel.'
                      : `${newPhotoCount} fotos novas por aprovar, assinaladas no carrossel.`}
                  </p>
                )}
                {isEdit && companion.pendingAudioUrl && (
                  <p className="mt-2">Áudio novo por aprovar, mais abaixo.</p>
                )}
                {isEdit && (
                  <p className="mt-2 text-muted-foreground">
                    Recusar descarta estas alterações e mantém o anúncio como
                    está. Não apaga o perfil.
                  </p>
                )}
              </div>
            )}
            <div className="relative w-full h-[32rem] bg-black/20 rounded-lg overflow-hidden">
              <Image
                src={currentImageUrl ?? '/image.png'}
                alt={companion.name}
                fill={true}
                className="object-contain rounded-lg"
              />
              {currentImageIsNew && (
                <Badge className="absolute top-2 right-2 bg-blue-600 text-white hover:bg-blue-600">
                  Foto nova
                </Badge>
              )}
              {images.length > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {currentImageIndex === 0
                    ? 'Capa'
                    : `${currentImageIndex + 1} de ${images.length}`}
                </div>
              )}
              {canFrameCurrent && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 left-2 bg-black/60 text-white hover:bg-black/80"
                  onClick={() => setImageToFrame(currentImage as Media)}
                >
                  <Crop className="h-4 w-4 mr-1.5" />
                  Centralizar
                </Button>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="bg-black/60 text-white hover:bg-black/80"
                    onClick={() => moveCurrentImage(-1)}
                    disabled={currentImageIndex === 0 || isSavingOrder}
                    title="Mover esta foto para trás"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="bg-black/60 text-white hover:bg-black/80"
                    onClick={() => moveCurrentImage(1)}
                    disabled={
                      currentImageIndex === images.length - 1 || isSavingOrder
                    }
                    title="Mover esta foto para a frente"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {companion.verificationVideoUrl && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Vídeo de Verificação</h3>
                <video
                  src={companion.verificationVideoUrl}
                  controls
                  className="w-full max-h-96 rounded-lg"
                />
              </div>
            )}

            {(companion.pendingAudioUrl || companion.currentAudioUrl) && (
              <div className="mt-4 space-y-3">
                <h3 className="text-lg font-semibold">Áudio</h3>
                {companion.pendingAudioUrl && (
                  <div className="space-y-1">
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                      Áudio novo
                    </Badge>
                    <audio
                      src={companion.pendingAudioUrl}
                      controls
                      preload="none"
                      className="w-full"
                    />
                  </div>
                )}
                {companion.currentAudioUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {companion.pendingAudioUrl
                        ? 'Áudio que está no perfil (é substituído ao aprovar):'
                        : 'Áudio do perfil:'}
                    </p>
                    <audio
                      src={companion.currentAudioUrl}
                      controls
                      preload="none"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {companion.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {isEditingAge ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={18}
                      max={99}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="h-8 w-20 text-sm"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      onClick={handleSaveAge}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setAge(companion.age);
                        setIsEditingAge(false);
                      }}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{age} anos</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setIsEditingAge(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.hairColor ?? '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.height ? `${companion.height}m` : '—'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Weight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.weight ? `${companion.weight}kg` : '—'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.eyeColor || '—'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={companion.silicone ? 'default' : 'secondary'}>
                Silicone
              </Badge>
              <Badge variant={companion.tattoos ? 'default' : 'secondary'}>
                Tatuagens
              </Badge>
              <Badge variant={companion.piercings ? 'default' : 'secondary'}>
                Piercings
              </Badge>
              <Badge variant={companion.smoker ? 'default' : 'secondary'}>
                Fumante
              </Badge>
            </div>

            <p>Descricão Curta</p>
            <p className="text-sm">{companion.shortDescription || '—'}</p>
          </CardContent>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <CardContent>
            {isLoadingDocs ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum documento enviado ainda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Show verification videos first */}
                {[...documents]
                  .sort((a, b) => {
                    // Prioritize verification videos
                    if (
                      a.document_type === 'verification_video' &&
                      b.document_type !== 'verification_video'
                    )
                      return -1;
                    if (
                      a.document_type !== 'verification_video' &&
                      b.document_type === 'verification_video'
                    )
                      return 1;
                    return 0;
                  })
                  .map((doc) => {
                    const estado = ESTADO_DOCUMENTO[doc.status] ?? ESTADO_DOCUMENTO.pendente;
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${isVerificationVideo(doc)
                          ? 'border-primary/50 bg-primary/5'
                          : ''
                          }`}
                        onClick={() => openDocumentDialog(doc)}
                      >
                        {renderDocumentPreview(doc)}
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {isVerificationVideo(doc)
                              ? 'Vídeo de Verificação'
                              : doc.document_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enviado em{' '}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                          <p className={`text-xs flex items-center mt-1 ${estado.className}`}>
                            {doc.status === 'aprovado' ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : doc.status === 'recusado' ? (
                              <XCircle size={12} className="mr-1" />
                            ) : (
                              <FileText size={12} className="mr-1" />
                            )}
                            {estado.texto}
                            {doc.status === 'recusado' && doc.notes ? `: ${doc.notes}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex flex-col gap-4">
        {/* Edição de um perfil no ar: como sempre. */}
        {isEdit && (
          <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleRejectEdit}
              disabled={isPending}
            >
              <X className="w-4 h-4 mr-2" /> Recusar alterações
            </Button>
            <Button
              className="w-full sm:w-1/2 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleApprove(false)}
              disabled={isPending}
            >
              <Check className="w-4 h-4 mr-2" /> Aprovar alterações
            </Button>
          </div>
        )}

        {/* No ar e com vídeo ou documento à espera: decide-se o selo. */}
        {docsNoAr && (
          <div className="w-full space-y-2">
            <p className="text-sm text-muted-foreground">
              Está no ar sem selo e enviou documentos. Veja-os no separador
              Documentos.
            </p>
            <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
              <Button
                variant="outline"
                className="w-full sm:w-1/2 border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => setDialogo('documentos')}
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" /> Recusar documentos
              </Button>
              <Button
                className="w-full sm:w-1/2 bg-green-500 hover:bg-green-600 text-white"
                onClick={handleVerifyIdentity}
                disabled={isPending}
              >
                <ShieldCheck className="w-4 h-4 mr-2" /> Verificar identidade
              </Button>
            </div>
          </div>
        )}

        {/* Registo por aprovar: pôr no ar (com ou sem selo) ou recusar. */}
        {!noAr && (
          <div className="w-full space-y-3">
            {wasSentToReview && (
              <p className="w-full text-sm text-amber-900 dark:text-amber-200">
                Este perfil já esteve publicado e foi tirado do ar por um admin.
                Aprovar devolve-o ao site; recusar tira-o da fila, sem apagar
                nada (fica nas Recusadas).
              </p>
            )}

            {temSelo ? (
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleApprove(false)}
                disabled={isPending}
              >
                <Check className="w-4 h-4 mr-2" /> Aprovar (já tem o selo)
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row w-full gap-4">
                {docsPendentes ? (
                  <Button
                    className="w-full sm:flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleApprove(true)}
                    disabled={isPending}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" /> Aprovar como verificada
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full sm:flex-1 bg-green-500 hover:bg-green-600 text-white"
                        disabled={isPending}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" /> Aprovar como verificada
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Recebeste o documento dela por WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ela não enviou vídeo nem documento pelo site. O perfil
                          vai para o ar com o selo &quot;Verificada&quot;, e fica
                          registado que foi por WhatsApp (só os admins vêem isto).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleApprove(true)}>
                          Sim, aprovar como verificada
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {!completaPendente && (
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => handleApprove(false)}
                    disabled={isPending}
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar sem verificação
                  </Button>
                )}
              </div>
            )}

            {completaPendente && !temSelo && (
              <p className="text-sm text-muted-foreground">
                Ela enviou vídeo e documento: aprove como verificada ou recuse
                os documentos. Depois de recusados, pode aprovar sem selo.
              </p>
            )}

            <div className="flex flex-col sm:flex-row w-full gap-4">
              {docsPendentes && (
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => setDialogo('documentos')}
                  disabled={isPending}
                >
                  <X className="w-4 h-4 mr-2" /> Recusar documentos
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full sm:flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => setDialogo('perfil')}
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" /> Recusar perfil
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {isPending && <p className="text-gray-500 text-sm">Processando...</p>}
      </CardFooter>

      <DialogoMotivo
        open={dialogo === 'perfil'}
        onOpenChange={(aberto) => setDialogo(aberto ? 'perfil' : null)}
        titulo={`Recusar o perfil de ${companion.name}`}
        descricao="Sai da fila sem apagar nada e vai para as Recusadas. Ela vê o motivo ao entrar e, se corrigir o perfil, volta para a fila. O RD recebe a recusa com este motivo."
        botao="Recusar perfil"
        aGravar={isPending}
        onConfirmar={handleRejectProfile}
      />
      <DialogoMotivo
        open={dialogo === 'documentos'}
        onOpenChange={(aberto) => setDialogo(aberto ? 'documentos' : null)}
        titulo="Recusar o vídeo e o documento"
        descricao="Ficam guardados como recusados. Ela vê o motivo e pode enviar outros. O perfil não muda: pode ser aprovado (ou continuar no ar) sem selo."
        botao="Recusar documentos"
        aGravar={isPending}
        onConfirmar={handleRejectDocuments}
      />

      {/* Document Detail Dialog */}
      <Dialog
        open={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedDocument?.document_type === 'verification_video'
                ? 'Vídeo de Verificação'
                : selectedDocument?.document_type.replace('_', ' ')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            {selectedDocument && (
              <>
                {!selectedDocument.url ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Ficheiro indisponível no armazenamento.
                  </p>
                ) : selectedDocument.document_type === 'verification_video' ? (
                  <div className="relative w-full aspect-video max-h-96">
                    <video
                      src={selectedDocument.url}
                      controls
                      className="w-full h-full rounded-md"
                      autoPlay={false}
                    >
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                  </div>
                ) : isPdfDocument(selectedDocument) ? (
                  <div className="flex justify-center py-8 bg-muted rounded-md">
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary"
                    >
                      <FileText className="mr-2" /> Ver documento PDF
                    </a>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={selectedDocument.url}
                      alt={selectedDocument.document_type}
                      fill
                      unoptimized
                      className="object-contain rounded-md"
                    />
                  </div>
                )}

                <div>
                  <p className="text-sm mb-1">
                    <strong>Estado:</strong>{' '}
                    {(ESTADO_DOCUMENTO[selectedDocument.status] ?? ESTADO_DOCUMENTO.pendente).texto}
                  </p>
                  <p className="text-sm mb-1">
                    <strong>Enviado:</strong>{' '}
                    {new Date(selectedDocument.created_at).toLocaleDateString()}
                  </p>
                  {selectedDocument.verification_date && (
                    <p className="text-sm mb-1">
                      <strong>Aprovado em:</strong>{' '}
                      {new Date(
                        selectedDocument.verification_date
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {selectedDocument.status === 'recusado' && selectedDocument.notes && (
                    <p className="text-sm mb-1">
                      <strong>Motivo da recusa:</strong> {selectedDocument.notes}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  A decisão é para o vídeo e o documento juntos, nos botões do
                  cartão.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageFramingDialog
        open={imageToFrame !== null}
        onOpenChange={(open) => {
          if (!open) setImageToFrame(null);
        }}
        imageUrl={imageToFrame?.publicUrl ?? null}
        initialFraming={
          imageToFrame
            ? mediaFraming(imageToFrame)
            : { focalX: 50, focalY: 50, zoom: 100 }
        }
        isSaving={isSavingFraming}
        onSave={handleSaveFraming}
      />
    </Card>
  );
}
