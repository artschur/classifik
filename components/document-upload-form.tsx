"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getSignedUploadUrl,
  saveDocumentAfterUpload,
} from "@/app/actions/document-verification";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, Upload, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EstadoPecaVerificacao } from "@/components/video-verification-form";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
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
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TEXT = {
  pt: {
    selecioneTipo: "Selecione um tipo de documento",
    ficheiroValido: "Envie um ficheiro válido",
    maximo5mb: "O ficheiro deve ter no máximo 5MB",
    falhaUrl: "Falha ao gerar URL de upload.",
    erroDesconhecido: "Erro desconhecido",
    erroUpload: (detalhe: string) => `Erro no upload: ${detalhe}`,
    falhaGuardar: "Falha ao guardar registo do documento.",
    erro: "Erro",
    naoAutenticado: "Utilizador não autenticado.",
    enviadoTitulo: "Documento enviado!",
    enviadoTexto: "Recebido. A equipa vai analisá-lo.",
    erroEnviar: "Ocorreu um erro ao enviar o documento.",
    titulo: "Documento de Identificação",
    obrigatorio: "Obrigatório",
    pedido: "Envie um documento oficial que possamos identificar que você tem idade mínima de 18 anos.",
    aceites: "Documentos aceites:",
    passaporte: "Passaporte",
    cartaoCidadao: "Cartão de Cidadão (Portugal)",
    rgOuOutro: "RG ou qualquer outro documento oficial que permita confirmar que você é maior de idade.",
    observacao: "Observação",
    observacaoTexto:
      "Solicitamos este requisito para segurança e evitarmos perfis falsificados, inclusive, evitando menores. Por isso, precisamos fazer este tipo de solicitação.",
    anteriorRecusado: "O documento anterior foi recusado",
    motivo: "Motivo:",
    envieOutro: "Envie outro abaixo.",
    pendente: "Pendente de aprovação",
    recebido: "O seu documento foi recebido e está a ser analisado pela nossa equipa.",
    tipoDocumento: "Tipo de Documento",
    selecioneOTipo: "Selecione o tipo de documento",
    opcaoPassaporte: "Passaporte",
    opcaoIdentidade: "Cartão de Cidadão / RG",
    opcaoCarta: "Carta de Condução / CNH",
    ficheiro: "Ficheiro (máx. 5MB)",
    seguranca: "A sua segurança é importante",
    seguranca1:
      "Todos os dados enviados são encriptados e utilizados exclusivamente para o processo de verificação da sua conta.",
    seguranca2: "Nunca partilhamos as suas informações com terceiros.",
    seguranca3:
      "O nosso compromisso é garantir a sua privacidade, segurança e confidencialidade em todas as etapas da verificação.",
    aEnviar: "A enviar documento...",
    enviar: "Enviar Documento",
  },
  en: {
    selecioneTipo: "Select a document type",
    ficheiroValido: "Please upload a valid file",
    maximo5mb: "The file must be 5MB or less",
    falhaUrl: "Could not prepare the upload.",
    erroDesconhecido: "Unknown error",
    erroUpload: (detalhe: string) => `Upload error: ${detalhe}`,
    falhaGuardar: "Could not save the document record.",
    erro: "Error",
    naoAutenticado: "You are not signed in.",
    enviadoTitulo: "Document sent!",
    enviadoTexto: "Received. Our team will review it.",
    erroEnviar: "Something went wrong while sending the document.",
    titulo: "ID Document",
    obrigatorio: "Required",
    pedido: "Send an official document that lets us confirm you are at least 18 years old.",
    aceites: "Accepted documents:",
    passaporte: "Passport",
    cartaoCidadao: "Portuguese Citizen Card (Cartão de Cidadão)",
    rgOuOutro: "Brazilian RG, driving licence (Brazilian CNH) or any other official document that confirms you are over 18.",
    observacao: "Please note",
    observacaoTexto:
      "We ask for this for safety reasons and to prevent fake profiles, including profiles of minors. That is why we need to make this request.",
    anteriorRecusado: "Your previous document was not accepted",
    motivo: "Reason:",
    envieOutro: "Please send another one below.",
    pendente: "Pending approval",
    recebido: "We have received your document and our team is reviewing it.",
    tipoDocumento: "Document type",
    selecioneOTipo: "Select the document type",
    opcaoPassaporte: "Passport",
    opcaoIdentidade: "Citizen Card / RG",
    opcaoCarta: "Driving licence / CNH",
    ficheiro: "File (max. 5MB)",
    seguranca: "Your safety matters",
    seguranca1:
      "Everything you send is encrypted and used only to verify your account.",
    seguranca2: "We never share your information with third parties.",
    seguranca3:
      "We are committed to keeping your data private, safe and confidential at every step of the verification.",
    aEnviar: "Sending document...",
    enviar: "Send Document",
  },
} as const;

// Mesmo esquema nas duas línguas: só mudam as mensagens.
function documentFormSchema(locale: Locale) {
  const t = TEXT[locale];
  return z.object({
    documentType: z.string().min(1, t.selecioneTipo),
    file: z
      .any()
      .refine((file) => file instanceof File, { message: t.ficheiroValido })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: t.maximo5mb,
      }),
  });
}

type DocumentFormValues = z.infer<ReturnType<typeof documentFormSchema>>;

async function uploadDocumentToSupabase(
  file: File,
  documentType: string,
  locale: Locale,
): Promise<{ success: true } | { success: false; error: string }> {
  const t = TEXT[locale];
  const fileExtension = file.name.split(".").pop() || "bin";
  const signedUrlResult = await getSignedUploadUrl(documentType, fileExtension);

  if (!signedUrlResult.success) {
    return { success: false, error: signedUrlResult.error ?? t.falhaUrl };
  }

  const { signedUrl, storagePath } = signedUrlResult;

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => t.erroDesconhecido);
    return { success: false, error: t.erroUpload(errorText) };
  }

  const saveResult = await saveDocumentAfterUpload(documentType, storagePath);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error ?? t.falhaGuardar };
  }

  return { success: true };
}

/**
 * Bloco do documento de identificação no passo da verificação. Como o do
 * vídeo: mostra o estado, aceita reenvio depois de uma recusa, e deixa a
 * página decidir o passo seguinte (`onEnviado`).
 */
export function DocumentUploadForm({
  estado: estadoInicial,
  motivoRecusa,
  onEnviado,
}: {
  estado: EstadoPecaVerificacao;
  motivoRecusa?: string | null;
  onEnviado?: () => void;
}) {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const locale = useLocale();
  const t = TEXT[locale];
  const schema = React.useMemo(() => documentFormSchema(locale), [locale]);
  const [estado, setEstado] = React.useState(estadoInicial);
  const recebido = estado === "pendente" || estado === "aprovado";
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { documentType: "" },
  });

  async function onSubmit(data: DocumentFormValues) {
    if (!isLoaded || !user?.id) {
      toast({ title: t.erro, description: t.naoAutenticado, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await uploadDocumentToSupabase(data.file, data.documentType, locale);

      if (result.success) {
        setEstado("pendente");
        toast({
          title: t.enviadoTitulo,
          description: t.enviadoTexto,
          variant: "success",
        });
        onEnviado?.();
      } else {
        toast({ title: t.erro, description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: t.erro,
        description: error instanceof Error ? error.message : t.erroEnviar,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.titulo}</h2>
          <span className="bg-rose-600 text-white text-sm font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shrink-0">
            {t.obrigatorio}
          </span>
        </div>
        <p className="text-xl font-semibold leading-snug text-foreground">
          {t.pedido}
        </p>
      </div>

      {/* Accepted documents */}
      <div className="border-2 border-border rounded-xl p-6 space-y-3 bg-muted/40">
        <h2 className="text-lg font-bold">{t.aceites}</h2>
        <ul className="space-y-2 text-base font-medium text-foreground/80">
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            {t.passaporte}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            {t.cartaoCidadao}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            {t.rgOuOutro}
          </li>
        </ul>
      </div>

      {/* Privacy note */}
      <div className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-6 flex gap-4">
        <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-base text-amber-900 dark:text-amber-400">{t.observacao}</h3>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
            {t.observacaoTexto}
          </p>
        </div>
      </div>

      {estado === "recusado" && (
        <div className="flex gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          <XCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">{t.anteriorRecusado}</p>
            {motivoRecusa && (
              <p className="text-sm">
                <strong>{t.motivo}</strong> {motivoRecusa}
              </p>
            )}
            <p className="text-sm">{t.envieOutro}</p>
          </div>
        </div>
      )}

      {recebido ? (
        <div className="flex flex-col items-center gap-3 py-10 border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
          <AlertCircle className="h-10 w-10 text-orange-500" />
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{t.pendente}</p>
          <p className="text-sm text-muted-foreground">{t.recebido}</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">{t.tipoDocumento}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={t.selecioneOTipo} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="passport">{t.opcaoPassaporte}</SelectItem>
                      <SelectItem value="id_card">{t.opcaoIdentidade}</SelectItem>
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
                  <FormLabel className="text-base font-bold">{t.ficheiro}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      className="h-12 text-base cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          if (file.size > MAX_FILE_SIZE) {
                            form.setError("file", { message: t.maximo5mb });
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

            {/* Security notice */}
            <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 space-y-2">
              <p className="text-sm font-bold">{t.seguranca}</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>{t.seguranca1}</li>
                <li>{t.seguranca2}</li>
                <li>{t.seguranca3}</li>
              </ul>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-base font-bold py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t.aEnviar}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  {t.enviar}
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
