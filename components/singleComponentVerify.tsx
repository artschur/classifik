'use client';

import {
  Check,
  X,
  User,
  Phone,
  MapPin,
  Languages,
  Ruler,
  Weight,
  Eye,
  Scissors,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  VideoIcon,
  AlertTriangle,
  Sparkle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useTransition } from 'react';
import { approveCompanion, rejectCompanion } from '@/db/queries/companions';
import Link from 'next/link';
import Image from 'next/image';
import { CompanionFiltered, Media } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  deleteAllDocumentsFromCompanion,
  getDocumentsByCompanionId,
  verifyDocument,
} from '@/app/actions/document-verification';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Document = {
  id: number;
  document_type: string;
  public_url: string;
  storage_path: string;
  verified: boolean;
  verification_date: string | null;
  notes: string | null;
  created_at: string;
};

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
  const [documentVerifyingId, setDocumentVerifyingId] = useState<number | null>(
    null
  );
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const images = companion.images
    .filter((media): media is string | Media => {
      if (typeof media === 'string') {
        return !media.match(/\.(mp4|webm|ogg)$/i);
      }
      return media.type !== 'video';
    })
    .map((media) => (typeof media === 'object' ? media.publicUrl : media));

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

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await approveCompanion(companion.id);
        toast({
          title: 'Companheira Aprovada',
          description: `${companion.name} foi aprovada com sucesso.`,
          variant: 'success',
        });
        onActionComplete(companion.id);
      } catch (e) {
        setError('Falha ao aprovar a companheira. Por favor, tente novamente.');
        toast({
          title: 'Erro',
          description: 'Falha ao aprovar a companheira. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteAllDocumentsFromCompanion(companion.id);
        await rejectCompanion(companion.id);

        toast({
          title: 'Companheira Rejeitada',
          description: `${companion.name} foi rejeitada.`,
          variant: 'success',
        });
        onActionComplete(companion.id);
      } catch (e) {
        setError('Falha ao rejeitar a companheira. Por favor, tente novamente.');
        toast({
          title: 'Erro',
          description: 'Falha ao rejeitar a companheira. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleVerifyDocument = (
    docId: number,
    documentType: string,
    verified: boolean
  ) => {
    setDocumentVerifyingId(docId);
    startTransition(async () => {
      try {
        const result = await verifyDocument(
          docId,
          verified,
          documentType,
          verificationNotes
        );
        if (result.success) {
          // Update local state
          setDocuments(
            documents.map((doc) =>
              doc.id === docId
                ? {
                  ...doc,
                  verified,
                  verification_date: verified
                    ? new Date().toISOString()
                    : null,
                  notes: verificationNotes || null,
                }
                : doc
            )
          );

          toast({
            title: verified ? 'Documento Verificado' : 'Documento Rejeitado',
            description: `O documento foi ${verified ? 'verificado' : 'rejeitado'
              } com sucesso.`,
            variant: 'success',
          });

          setVerificationNotes('');
        } else {
          toast({
            title: 'Erro',
            description:
              result.error || 'Ocorreu um erro ao verificar o documento',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar o status de verificação do documento.',
          variant: 'destructive',
        });
      } finally {
        setDocumentVerifyingId(null);
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
    if (doc.public_url.endsWith('.pdf')) {
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
          <Image
            src={doc.public_url}
            alt={doc.document_type}
            fill
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
          <CardTitle className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
            {companion.name}
          </CardTitle>
        </div>
      </CardHeader>
      <Tabs defaultValue="profile" className="">
        <TabsList className="grid grid-cols-2 ">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="documents">
            Documentos ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <CardContent className="grid gap-4">
            <div className="relative aspect-auto h-64">
              <Image
                src={images[currentImageIndex] ?? '/image.png'}
                alt={companion.name}
                fill={true}
                className="object-cover rounded-lg"
              />
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

            <p className="text-sm text-muted-foreground">
              {companion.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.age} anos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.hairColor}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.height}m</span>
              </div>
              <div className="flex items-center space-x-2">
                <Weight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.weight}kg</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{companion.eyeColor || 'N/A'}</span>
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
            <p className="text-sm">{companion.shortDescription}</p>
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
                {documents
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
                  .map((doc) => (
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
                        <div className="flex items-center mt-1">
                          {doc.verified ? (
                            <span className="text-xs flex items-center text-green-600">
                              <CheckCircle size={12} className="mr-1" />{' '}
                              Verificado
                              {isVerificationVideo(doc) &&
                                ' (Será excluído automaticamente para privacidade)'}
                            </span>
                          ) : (
                            <span className="text-xs flex items-center text-amber-600">
                              <FileText size={12} className="mr-1" /> Pendente
                              de verificação
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!doc.verified ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyDocument(
                                doc.id,
                                doc.document_type,
                                true
                              );
                            }}
                            disabled={documentVerifyingId === doc.id}
                          >
                            <Check className="h-4 w-4 mr-1" /> Verificar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-600 hover:bg-amber-600 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyDocument(
                                doc.id,
                                doc.document_type,
                                false
                              );
                            }}
                            disabled={documentVerifyingId === doc.id}
                          >
                            <X className="h-4 w-4 mr-1" /> Desverificar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex flex-col gap-4">
        <Textarea
          placeholder="Adicionar notas de verificação (opcional)"
          className="mb-2"
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <Button
            variant="outline"
            className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
            onClick={handleReject}
            disabled={isPending}
          >
            <X className="w-4 h-4 mr-2" /> Rejeitar
          </Button>
          <Button
            className="w-full sm:w-1/2 bg-green-500 hover:bg-green-600 text-white"
            onClick={handleApprove}
            disabled={isPending}
          >
            <Check className="w-4 h-4 mr-2" /> Aprovar
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {isPending && <p className="text-gray-500 text-sm">Processando...</p>}
      </CardFooter>

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
                {selectedDocument.document_type === 'verification_video' ? (
                  <div className="relative w-full aspect-video max-h-96">
                    <video
                      src={selectedDocument.public_url}
                      controls
                      className="w-full h-full rounded-md"
                      autoPlay={false}
                    >
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                    {selectedDocument.verified && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        Verificado (será excluído)
                      </div>
                    )}
                  </div>
                ) : selectedDocument.public_url.endsWith('.pdf') ? (
                  <div className="flex justify-center py-8 bg-muted rounded-md">
                    <a
                      href={selectedDocument.public_url}
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
                      src={selectedDocument.public_url}
                      alt={selectedDocument.document_type}
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                )}

                <div>
                  <p className="text-sm mb-1">
                    <strong>Status:</strong>{' '}
                    {selectedDocument.verified
                      ? 'Verificado'
                      : 'Pendente de verificação'}
                  </p>
                  <p className="text-sm mb-1">
                    <strong>Enviado:</strong>{' '}
                    {new Date(selectedDocument.created_at).toLocaleDateString()}
                  </p>
                  {selectedDocument.verification_date && (
                    <p className="text-sm mb-1">
                      <strong>Verificado em:</strong>{' '}
                      {new Date(
                        selectedDocument.verification_date
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea
                    value={verificationNotes || selectedDocument.notes || ''}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Adicionar notas de verificação..."
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                    onClick={() =>
                      handleVerifyDocument(
                        selectedDocument.id,
                        selectedDocument.document_type,
                        false
                      )
                    }
                    disabled={documentVerifyingId === selectedDocument.id}
                  >
                    <X className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                  <Button
                    className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                    variant="outline"
                    onClick={() =>
                      handleVerifyDocument(
                        selectedDocument.id,
                        selectedDocument.document_type,
                        true
                      )
                    }
                    disabled={documentVerifyingId === selectedDocument.id}
                  >
                    <Check className="h-4 w-4 mr-1" /> Verificar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
