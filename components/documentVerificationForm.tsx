'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  uploadDocument,
  getDocumentsByAuthId,
  deleteDocument,
  isCompanionVerified,
} from '@/app/actions/document-verification';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  X,
  Check,
  Upload,
  AlertTriangle,
  VideoIcon,
  FileText,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const DocumentFormSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  file: z.any().refine((file) => file instanceof File, {
    message: 'File is required',
  }),
});

type Document = {
  id: number;
  authId: string;
  document_type: string;
  public_url: string;
  storage_path: string;
  verified: boolean | null;
  verification_date: Date | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  companionId: number;
};

export function DocumentVerificationForm() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [documentToDelete, setDocumentToDelete] = React.useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [videoUploaded, setVideoUploaded] = React.useState(false);
  const [companionVerified, setCompanionVerified] = React.useState(false);

  const form = useForm<z.infer<typeof DocumentFormSchema>>({
    resolver: zodResolver(DocumentFormSchema),
    defaultValues: {
      documentType: '',
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function fetchDocuments() {
      if (isLoaded && user?.id) {
        setIsLoading(true);
        try {
          const [result, verified] = await Promise.all([
            getDocumentsByAuthId(user.id),
            isCompanionVerified(user.id),
          ]);

          // Set verification status
          setCompanionVerified(!!verified);

          if (result.success) {
            setDocuments(result.documents as Document[]);
            const hasVerificationVideo = (result.documents as Document[]).some(
              (doc) => doc.document_type === 'verification_video'
            );
            setVideoUploaded(hasVerificationVideo);
          } else {
            toast({
              title: 'Erro ao buscar documentos',
              description: result.error,
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Erro ao buscar documentos',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchDocuments();
  }, [isLoaded, user?.id, toast]);

  React.useEffect(() => {
    if (companionVerified) {
      router.push('/companions/verification/success');
    }
  }, [companionVerified, router]);

  // If verified, show a loading state until redirect happens
  if (companionVerified) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <p>Redirecionando para página de sucesso...</p>
      </div>
    );
  }

  async function onSubmit(data: z.infer<typeof DocumentFormSchema>) {
    if (!isLoaded || !user?.id) {
      toast({
        title: 'Error',
        description: 'Usuario não autenticado',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('documentType', data.documentType);

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: 'Documento enviado',
          description:
            'Seu documento foi enviado com sucesso e está aguardando revisão',
          variant: 'success',
        });

        // Reset form
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Refresh documents list
        const updatedDocs = await getDocumentsByAuthId(user.id);
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          setVideoUploaded(
            updatedDocs.documents.some(
              (doc: Document) => doc.document_type === 'verification_video'
            )
          );
        }
      } else {
        toast({
          title: 'Upload falhou',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao enviar o documento',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (
      !isLoaded ||
      !user?.id ||
      !e.target.files ||
      e.target.files.length === 0
    ) {
      return;
    }

    const videoFile = e.target.files[0];
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('documentType', 'verification_video');

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: 'Video de verificação enviado',
          description:
            'Seu video foi enviado com sucesso e está aguardando revisão',
          variant: 'success',
        });

        // Reset input
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }

        // Refresh documents list
        const updatedDocs = await getDocumentsByAuthId(user.id);
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          setVideoUploaded(true);
        }
      } else {
        toast({
          title: 'Upload failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao enviar o video',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteDocument = async (id: number) => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument(id);

      if (result.success) {
        // Remove from local state
        const deletedDoc = documents.find((doc) => doc.id === id);
        setDocuments(documents.filter((doc) => doc.id !== id));

        // Update video upload state if we just deleted a verification video
        if (deletedDoc?.document_type === 'verification_video') {
          setVideoUploaded(false);
        }

        toast({
          title: 'Documento deletado',
          description: 'Documento deletado com sucesso',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Falha ao deletar documento',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const renderDocumentStatus = (verified: boolean) => {
    if (verified) {
      return (
        <div className="flex items-center text-green-600">
          <Check size={16} className="mr-1" />
          <span>Verificado</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-amber-600">
        <AlertTriangle size={16} className="mr-1" />
        <span>Aguardando verificação</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Verification Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <VideoIcon className="mr-2 h-6 w-6" />
            Video de Verificação
            {videoUploaded && (
              <span className="ml-4 text-sm text-center bg-orange-400 text-orange-950 px-2 py-1 rounded-full">
                Review em andamento
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-base max-w-[60%]">
            Esse video aparecerá no seu perfil e estará visível para outros
            usuários para garantir uma maior segurança aos nossos clientes.
            <br /> Ele serve também para garantir que suas caracteristicas
            correspondem as informadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <Info className="h-4 w-4" />
            <AlertDialogTitle>
              Intruções para o Video de Verificação
            </AlertDialogTitle>
            <AlertDialogDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  Grave um vídeo curto (15 segundos) com seu celular, do corpo
                  inteiro e mostrando seu corpo, apenas com roupas íntimas.
                </li>
                <li>Dê uma volta completa</li>
                <li>
                  Segure um papel com seu nome, idade, data do dia e "Onesugar"
                  escrito embaixo.
                </li>
              </ul>
            </AlertDialogDescription>
          </AlertDialog>

          {videoUploaded ? (
            <div className="text-center py-4">
              <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-green-600 font-medium">
                Video enviado com sucesso
              </p>

              {documents
                .filter((doc) => doc.document_type === 'verification_video')
                .map((video) => (
                  <div key={video.id} className="mt-4 flex justify-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-destructive">
                          Deletar Video
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso vai deletar o seu video de verificação.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDocument(video.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="max-w-md"
                onChange={handleVideoUpload}
                disabled={isSubmitting}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Documento de Identidade</CardTitle>
          <CardDescription>
            Faça upload dos seus documentos de identificação para verificação.
            Isso é necessário para verificar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="id_card">Identidade</SelectItem>
                        <SelectItem value="passport">Passaporte</SelectItem>
                        <SelectItem value="drivers_license">
                          Carteira de Motorista
                        </SelectItem>
                        <SelectItem value="selfie">Selfie com ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione o tipo de documento que você está enviando.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Escolher documento</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        {...rest}
                      />
                    </FormControl>
                    <FormDescription>
                      Envie uma imagem ou pdf(max 5MB).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Enviar documento
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Uploaded Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Seus documentos</CardTitle>
          <CardDescription>
            Documents que você enviou para verificação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ||
            (documents.length === 1 &&
              documents[0].document_type === 'verification_video') ? (
            <div className="text-center py-8 text-muted-foreground">
              Sem documentos enviados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents
                .filter((doc) => doc.document_type !== 'verification_video')
                .map((document) => (
                  <Card key={document.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3]">
                        {document.public_url.endsWith('.pdf') ? (
                          <div className="flex items-center justify-center h-full bg-muted p-4">
                            <p className="text-center">PDF Document</p>
                          </div>
                        ) : (
                          <Image
                            src={document.public_url}
                            alt={`${document.document_type} document`}
                            fill
                            className="object-cover"
                          />
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => setDocumentToDelete(document.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso vai deletar o documento e não pode ser
                                desfeito.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  document.id &&
                                  handleDeleteDocument(document.id)
                                }
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold capitalize mb-1">
                          {document.document_type.replace('_', ' ')}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Uploaded on{' '}
                          {new Date(
                            document.created_at ?? 'Recentemente'
                          ).toLocaleDateString()}
                        </p>
                        {renderDocumentStatus(document.verified ?? false)}
                        {document.notes && (
                          <p className="mt-2 text-sm italic border-l-2 border-muted-foreground pl-2">
                            {document.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
