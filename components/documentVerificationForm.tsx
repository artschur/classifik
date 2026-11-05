"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getSignedUploadUrl,
  saveDocumentAfterUpload,
  getMyDocuments,
  deleteDocument,
} from "@/app/actions/document-verification";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  X,
  Check,
  Upload,
  AlertTriangle,
  VideoIcon,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB - Documents bucket limit

const TEXT = {
  pt: {
    selecioneTipo: "Selecione um tipo de documento",
    arquivoValido: "Envie um arquivo válido, menos de 50MB",
    maximoArquivo: (mb: number) => `O arquivo deve ter no máximo ${mb}MB`,
    falhaUrl: "Falha ao gerar URL de upload.",
    erroUpload: (detalhe: string) => `Erro no upload: ${detalhe}`,
    falhaSalvar: "Falha ao salvar registro do documento.",
    erro: "Erro",
    naoCarregou: "Não foi possível carregar os documentos.",
    erroCarregar: "Ocorreu um erro ao carregar os documentos.",
    videoGrande: "Vídeo muito grande",
    videoMaximo: (mb: number) =>
      `O vídeo deve ter no máximo ${mb}MB. Use um aplicativo para comprimir o vídeo antes de enviar.`,
    formatoInvalido: "Formato inválido",
    videoValido: "Por favor, envie um arquivo de vídeo válido.",
    preparando: "Preparando upload...",
    enviandoDiretamente: "Enviando vídeo diretamente...",
    videoEnviadoTitulo: "Vídeo enviado",
    videoEnviadoTexto: "Seu vídeo foi enviado com sucesso e está aguardando revisão.",
    falhaVideo: "Falha ao enviar o vídeo.",
    erroVideo: "Ocorreu um erro ao enviar o vídeo.",
    usuarioNaoAutenticado: "Usuário não autenticado.",
    perfilCriadoTitulo: "Perfil criado com sucesso!",
    perfilCriadoTexto:
      "Os seus documentos foram enviados e o perfil está a ser verificado pela nossa equipa.",
    falhaDocumento: "Falha ao enviar o documento.",
    erroDocumento: "Ocorreu um erro ao enviar o documento.",
    videoVerificacao: "Vídeo de Verificação",
    emRevisao: "Em revisão",
    videoDescricao:
      "Grave um vídeo curto para confirmar sua identidade. Este vídeo não será exibido no seu perfil e é usado apenas para verificação.",
    limite: "Limite de tamanho: 50MB",
    seMaior: "Se seu vídeo for maior, use um aplicativo de compressão:",
    online: "clideo.com ou freeconvert.com",
    videoSucesso: "Vídeo enviado com sucesso",
    enviandoVideo: "Enviando vídeo...",
    escolherVideo: "Escolher vídeo",
    instrucoes:
      'Envie um vídeo curto (10-15 segundos, máx. 50MB) mostrando seu rosto e segurando um papel com a data de hoje e "Onesugar" escrito.',
    documentosIdentidade: "Documentos de Identidade",
    documentosDescricao: "Envie seus documentos de identificação para verificar sua conta.",
    tipoDocumento: "Tipo de Documento",
    selecioneOTipo: "Selecione o tipo de documento",
    opcaoIdentidade: "Identidade",
    opcaoPassaporte: "Passaporte",
    opcaoCarta: "B.I",
    arquivo: "Arquivo",
    enviando: "Enviando...",
    enviarDocumento: "Enviar Documento",
  },
  en: {
    selecioneTipo: "Select a document type",
    arquivoValido: "Please upload a valid file under 50MB",
    maximoArquivo: (mb: number) => `The file must be ${mb}MB or less`,
    falhaUrl: "Could not prepare the upload.",
    erroUpload: (detalhe: string) => `Upload error: ${detalhe}`,
    falhaSalvar: "Could not save the document record.",
    erro: "Error",
    naoCarregou: "Could not load your documents.",
    erroCarregar: "Something went wrong while loading your documents.",
    videoGrande: "Video too large",
    videoMaximo: (mb: number) =>
      `The video must be ${mb}MB or less. Use an app to compress the video before sending.`,
    formatoInvalido: "Invalid format",
    videoValido: "Please upload a valid video file.",
    preparando: "Preparing upload...",
    enviandoDiretamente: "Sending video...",
    videoEnviadoTitulo: "Video sent",
    videoEnviadoTexto: "Your video has been sent and is waiting for review.",
    falhaVideo: "Could not send the video.",
    erroVideo: "Something went wrong while sending the video.",
    usuarioNaoAutenticado: "You are not signed in.",
    perfilCriadoTitulo: "Profile created!",
    perfilCriadoTexto:
      "Your documents have been sent and our team is verifying your profile.",
    falhaDocumento: "Could not send the document.",
    erroDocumento: "Something went wrong while sending the document.",
    videoVerificacao: "Verification video",
    emRevisao: "Under review",
    videoDescricao:
      "Record a short video to confirm your identity. This video is not shown on your profile and is used only for verification.",
    limite: "Size limit: 50MB",
    seMaior: "If your video is larger, use a compression app:",
    online: "clideo.com or freeconvert.com",
    videoSucesso: "Video sent",
    enviandoVideo: "Sending video...",
    escolherVideo: "Choose video",
    instrucoes:
      'Send a short video (10 to 15 seconds, max. 50MB) showing your face and holding a piece of paper with today\'s date and "Onesugar" written on it.',
    documentosIdentidade: "ID documents",
    documentosDescricao: "Send your ID documents to verify your account.",
    tipoDocumento: "Document type",
    selecioneOTipo: "Select the document type",
    opcaoIdentidade: "Citizen Card / RG",
    opcaoPassaporte: "Passport",
    opcaoCarta: "Driving licence / CNH",
    arquivo: "File",
    enviando: "Sending...",
    enviarDocumento: "Send Document",
  },
} as const;

// Mesmo esquema nas duas línguas: só mudam as mensagens.
function documentFormSchema(locale: Locale) {
  const t = TEXT[locale];
  return z.object({
    documentType: z.string().min(1, t.selecioneTipo),
    file: z
      .any()
      .refine((file) => file instanceof File, {
        message: t.arquivoValido,
      })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: t.maximoArquivo(5),
      }),
  });
}

type DocumentFormValues = z.infer<ReturnType<typeof documentFormSchema>>;

type Document = {
  id: number;
  document_type: string;
  verified: boolean | null;
  created_at: Date | null;
};

/**
 * Uploads a file directly to Supabase using a signed upload URL,
 * bypassing serverless function payload limits.
 */
async function uploadFileDirectToSupabase(
  file: File,
  documentType: string,
  locale: Locale,
): Promise<{ success: true } | { success: false; error: string }> {
  const t = TEXT[locale];
  // Step 1: Get a signed upload URL from the server
  const fileExtension = file.name.split(".").pop() || "bin";
  const signedUrlResult = await getSignedUploadUrl(documentType, fileExtension);

  if (!signedUrlResult.success) {
    return {
      success: false,
      error: signedUrlResult.error ?? t.falhaUrl,
    };
  }

  // Step 2: Upload the file directly to Supabase from the client
  const { signedUrl, storagePath, token } = signedUrlResult;

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse
      .text()
      .catch(() => "Unknown upload error");
    return { success: false, error: t.erroUpload(errorText) };
  }

  // Step 3: Save document metadata to the database
  const saveResult = await saveDocumentAfterUpload(documentType, storagePath);

  if (!saveResult.success) {
    return {
      success: false,
      error: saveResult.error ?? t.falhaSalvar,
    };
  }

  return { success: true };
}

export function DocumentVerificationForm({
  uploadStatus,
}: {
  uploadStatus?: {
    isVerificationVideoUploaded: boolean;
    isDocumentUploaded: boolean;
  };
}) {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const locale = useLocale();
  const t = TEXT[locale];
  const schema = React.useMemo(() => documentFormSchema(locale), [locale]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [videoUploaded, setVideoUploaded] = React.useState(
    uploadStatus?.isVerificationVideoUploaded ?? false,
  );
  const [documentUploaded, setDocumentUploaded] = React.useState(
    uploadStatus?.isDocumentUploaded ?? false,
  );
  const [isUploadingVideo, setIsUploadingVideo] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "",
    },
  });

  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function fetchDocuments() {
      if (isLoaded && user?.id) {
        setIsLoading(true);
        try {
          const result = await getMyDocuments();
          if (result.success) {
            setDocuments(result.documents as Document[]);
            const hasVerificationVideo = result.documents.some(
              (doc: Document) => doc.document_type === "verification_video",
            );
            setVideoUploaded(hasVerificationVideo);
            const hasIdDocument = result.documents.some((doc: Document) =>
              ["id_card", "passport", "drivers_license", "selfie"].includes(
                doc.document_type,
              ),
            );
            setDocumentUploaded(hasIdDocument);
          } else {
            toast({
              title: t.erro,
              description: t.naoCarregou,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching documents:", error);
          toast({
            title: t.erro,
            description: t.erroCarregar,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchDocuments();
  }, [isLoaded, user?.id, toast, t]);

  async function handleVideoUpload(videoFile: File) {
    if (!isLoaded || !user?.id) {
      return;
    }

    // Validate video size
    if (videoFile.size > MAX_VIDEO_SIZE) {
      toast({
        title: t.videoGrande,
        description: t.videoMaximo(MAX_VIDEO_SIZE / 1024 / 1024),
        variant: "destructive",
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    // Validate video type
    if (!videoFile.type.startsWith("video/")) {
      toast({
        title: t.formatoInvalido,
        description: t.videoValido,
        variant: "destructive",
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(t.preparando);

    try {
      setUploadProgress(t.enviandoDiretamente);
      const result = await uploadFileDirectToSupabase(
        videoFile,
        "verification_video",
        locale,
      );

      if (result.success) {
        toast({
          title: t.videoEnviadoTitulo,
          description: t.videoEnviadoTexto,
          variant: "success",
        });

        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }

        const updatedDocs = await getMyDocuments();
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          setVideoUploaded(true);
        }
      } else {
        console.error("Upload failed:", result.error);
        toast({
          title: t.erro,
          description: result.error || t.falhaVideo,
          variant: "destructive",
        });
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: t.erro,
        description:
          error instanceof Error
            ? error.message
            : t.erroVideo,
        variant: "destructive",
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress("");
    }
  }

  async function onSubmit(data: DocumentFormValues) {
    if (!isLoaded || !user?.id) {
      toast({
        title: t.erro,
        description: t.usuarioNaoAutenticado,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await uploadFileDirectToSupabase(
        data.file,
        data.documentType,
        locale,
      );

      if (result.success) {
        toast({
          title: t.perfilCriadoTitulo,
          description: t.perfilCriadoTexto,
          variant: "success",
        });

        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        const updatedDocs = await getMyDocuments();
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          const hasIdDocument = updatedDocs.documents.some((doc: Document) =>
            ["id_card", "passport", "drivers_license", "selfie"].includes(
              doc.document_type,
            ),
          );
          setDocumentUploaded(hasIdDocument);
        }
      } else {
        console.error("Upload failed:", result.error);
        toast({
          title: t.erro,
          description: result.error || t.falhaDocumento,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: t.erro,
        description:
          error instanceof Error
            ? error.message
            : t.erroDocumento,
        variant: "destructive",
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
            {t.videoVerificacao}
            {videoUploaded && (
              <span className="ml-4 text-sm text-center bg-orange-400 text-orange-950 px-2 py-1 rounded-full">
                {t.emRevisao}
              </span>
            )}
          </CardTitle>
          <CardDescription>{t.videoDescricao}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">{t.limite}</p>
                <p>{t.seMaior}</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>
                    <strong>iPhone:</strong> Video Compress (App Store)
                  </li>
                  <li>
                    <strong>Android:</strong> Video Compressor (Play Store)
                  </li>
                  <li>
                    <strong>Online:</strong> {t.online}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {videoUploaded ? (
            <div className="text-center py-4">
              <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-green-600 font-medium">{t.videoSucesso}</p>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      {uploadProgress || t.enviandoVideo}
                    </>
                  ) : (
                    <>
                      <VideoIcon className="mr-2 h-4 w-4" /> {t.escolherVideo}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{t.instrucoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Document Upload Section - Only show after video is uploaded */}
      {videoUploaded && (
        <Card>
          <CardHeader>
            <CardTitle>{t.documentosIdentidade}</CardTitle>
            <CardDescription>{t.documentosDescricao}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.tipoDocumento}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selecioneOTipo} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="id_card">{t.opcaoIdentidade}</SelectItem>
                          <SelectItem value="passport">{t.opcaoPassaporte}</SelectItem>
                          <SelectItem value="drivers_license">{t.opcaoCarta}</SelectItem>
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
                      <FormLabel>{t.arquivo}</FormLabel>
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
                                form.setError("file", {
                                  message: t.maximoArquivo(MAX_FILE_SIZE / 1024 / 1024),
                                });
                              } else {
                                form.clearErrors("file");
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

                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingVideo}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      {t.enviando}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> {t.enviarDocumento}
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
