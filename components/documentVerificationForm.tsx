'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  uploadDocument,
  getDocumentsByAuthId,
  deleteDocument,
} from '@/app/actions/document-verification';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Check, Upload, AlertTriangle, VideoIcon, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB - Documents bucket limit

const DocumentFormSchema = z.object({
  documentType: z.string().min(1, 'Selecione um tipo de documento'),
  file: z
    .any()
    .refine((file) => file instanceof File, {
      message: 'Envie um arquivo válido',
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: 'O arquivo deve ter no máximo 5MB',
    }),
});

type Document = {
  id: number;
  document_type: string;
  public_url: string;
  verified: boolean | null;
  created_at: Date | null;
};

export function DocumentVerificationForm({ uploadStatus }: { uploadStatus?: { isVerificationVideoUploaded: boolean; isDocumentUploaded: boolean } }) {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [videoUploaded, setVideoUploaded] = React.useState(uploadStatus?.isVerificationVideoUploaded ?? false);
  const [documentUploaded, setDocumentUploaded] = React.useState(uploadStatus?.isDocumentUploaded ?? false);
  const [isUploadingVideo, setIsUploadingVideo] = React.useState(false);

  const form = useForm<z.infer<typeof DocumentFormSchema>>({
    resolver: zodResolver(DocumentFormSchema),
    defaultValues: {
      documentType: '',
    },
  });

  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function fetchDocuments() {
      if (isLoaded && user?.id) {
        setIsLoading(true);
        try {
          const result = await getDocumentsByAuthId(user.id);
          if (result.success) {
            setDocuments(result.documents as Document[]);
            const hasVerificationVideo = result.documents.some(
              (doc: Document) => doc.document_type === 'verification_video',
            );
            setVideoUploaded(hasVerificationVideo);
            const hasIdDocument = result.documents.some((doc: Document) =>
              ['id_card', 'passport', 'drivers_license', 'selfie'].includes(doc.document_type),
            );
            setDocumentUploaded(hasIdDocument);
          } else {
            toast({
              title: 'Erro',
              description: 'Não foi possível carregar os documentos.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error fetching documents:', error);
          toast({
            title: 'Erro',
            description: 'Ocorreu um erro ao carregar os documentos.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchDocuments();
  }, [isLoaded, user?.id, toast]);

  async function handleVideoUpload(videoFile: File) {
    if (!isLoaded || !user?.id) {
      return;
    }

    // Validate video size
    if (videoFile.size > MAX_VIDEO_SIZE) {
      toast({
        title: 'Vídeo muito grande',
        description: `O vídeo deve ter no máximo ${MAX_VIDEO_SIZE / 1024 / 1024}MB. Use um aplicativo para comprimir o vídeo antes de enviar.`,
        variant: 'destructive',
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    // Validate video type
    if (!videoFile.type.startsWith('video/')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo de vídeo válido.',
        variant: 'destructive',
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    setIsUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('documentType', 'verification_video');

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: 'Vídeo enviado',
          description: 'Seu vídeo foi enviado com sucesso e está aguardando revisão.',
          variant: 'success',
        });

        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }

        const updatedDocs = await getDocumentsByAuthId(user.id);
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          setVideoUploaded(true);
        }
      } else {
        console.error('Upload failed:', result.error);
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao enviar o vídeo.',
          variant: 'destructive',
        });
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar o vídeo.',
        variant: 'destructive',
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    } finally {
      setIsUploadingVideo(false);
    }
  }

  async function onSubmit(data: z.infer<typeof DocumentFormSchema>) {
    if (!isLoaded || !user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
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
          description: 'Seu documento foi enviado com sucesso e está aguardando revisão.',
          variant: 'success',
        });

        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        const updatedDocs = await getDocumentsByAuthId(user.id);
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          const hasIdDocument = updatedDocs.documents.some((doc: Document) =>
            ['id_card', 'passport', 'drivers_license', 'selfie'].includes(doc.document_type),
          );
          setDocumentUploaded(hasIdDocument);
        }
      } else {
        console.error('Upload failed:', result.error);
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao enviar o documento.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar o documento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Verification Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <VideoIcon className="mr-2 h-6 w-6" />
            Vídeo de Verificação
            {videoUploaded && (
              <span className="ml-4 text-sm text-center bg-orange-400 text-orange-950 px-2 py-1 rounded-full">
                Em revisão
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Grave um vídeo curto para confirmar sua identidade. Este vídeo não será exibido no seu
            perfil e é usado apenas para verificação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Limite de tamanho: 20MB</p>
                <p>Se seu vídeo for maior, use um aplicativo de compressão:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>iPhone:</strong> Video Compress (App Store)</li>
                  <li><strong>Android:</strong> Video Compressor (Play Store)</li>
                  <li><strong>Online:</strong> clideo.com ou freeconvert.com</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Exemplo de como gravar seu vídeo:</p>
            <div className="w-full aspect-video">
              <iframe
                className="w-full h-full rounded-lg border shadow-sm"
                src="https://youtube.com/embed/m5Tja4hJMXQ?autoplay=1&controls=0&mute=0&loop=1&playlist=m5Tja4hJMXQ&modestbranding=1&showinfo=0&rel=0"
                title="ídeo de Verificação"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          {videoUploaded ? (
            <div className="text-center py-4">
              <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-green-600 font-medium">Vídeo enviado com sucesso</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                <Input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleVideoUpload(file);
                    }
                  }}
                  disabled={isUploadingVideo}
                />
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando vídeo...
                    </>
                  ) : (
                    <>
                      <VideoIcon className="mr-2 h-4 w-4" /> Escolher vídeo
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Envie um vídeo curto (10-15 segundos, máx. 20MB) mostrando seu rosto e segurando um papel com a
                data de hoje e "Onesugar" escrito.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Document Upload Section - Only show after video is uploaded */}
      {videoUploaded && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos de Identidade</CardTitle>
            <CardDescription>
              Envie seus documentos de identificação para verificar sua conta.
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
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de documento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="id_card">Identidade</SelectItem>
                          <SelectItem value="passport">Passaporte</SelectItem>
                          <SelectItem value="drivers_license">B.I</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange } }) => (
                    <FormItem>
                      <FormLabel>Arquivo</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                              // Validate size immediately
                              if (file.size > MAX_FILE_SIZE) {
                                form.setError('file', {
                                  message: `O arquivo deve ter no máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                                });
                              } else {
                                form.clearErrors('file');
                              }
                            }
                          }}
                          accept="image/jpeg,image/png,application/pdf"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting || isUploadingVideo}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Enviar Documento
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
