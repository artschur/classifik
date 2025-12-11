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

const DocumentFormSchema = z.object({
  documentType: z.string().min(1, 'Selecione um tipo de documento'),
  file: z.any().refine((file) => file instanceof File, {
    message: 'Envie um arquivo válido',
  }),
});

type Document = {
  id: number;
  document_type: string;
  public_url: string;
  verified: boolean | null;
  created_at: Date | null;
};

export function DocumentVerificationForm() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [videoUploaded, setVideoUploaded] = React.useState(false);

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

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isLoaded || !user?.id || !e.target.files || e.target.files.length === 0) {
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
          description: 'Falha ao enviar o vídeo.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar o vídeo.',
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
              <Input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="max-w-md"
                onChange={handleVideoUpload}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Envie um vídeo curto (15 segundos) mostrando seu rosto e segurando um papel com a
                data de hoje e "Onesugar" escrito.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos de Identidade</CardTitle>
          <CardDescription>
            Envie seus documentos de identificação para verificar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-6">
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
                          }
                        }}
                        accept="image/jpeg,image/png,application/pdf"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
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
    </div>
  );
}
