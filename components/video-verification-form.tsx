"use client";

import * as React from "react";
import {
  getSignedUploadUrl,
  saveDocumentAfterUpload,
} from "@/app/actions/document-verification";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, VideoIcon, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const TEXT = {
  pt: {
    falhaUrl: "Falha ao gerar URL de upload.",
    erroDesconhecido: "Erro desconhecido",
    erroUpload: (detalhe: string) => `Erro no upload: ${detalhe}`,
    falhaGuardar: "Falha ao guardar registo do vídeo.",
    demasiadoGrande: "Vídeo demasiado grande",
    maximo50mb: "O vídeo deve ter no máximo 50MB. Comprima-o antes de enviar.",
    formatoInvalido: "Formato inválido",
    videoValido: "Por favor, envie um ficheiro de vídeo válido.",
    aEnviar: "A enviar vídeo...",
    enviadoTitulo: "Vídeo enviado!",
    enviadoTexto: "Recebido. A equipa vai analisá-lo.",
    erro: "Erro",
    erroEnviar: "Ocorreu um erro ao enviar o vídeo.",
    titulo: "Vídeo 360° com um papel",
    obrigatorio: "Obrigatório",
    pedidoAntes: "Grave um vídeo 360° mostrando claramente o seu rosto e corpo, segurando um papel com a palavra ",
    pedidoDepois: " e a data de hoje.",
    observacoes: "Observações para o vídeo:",
    obs1: "Mostre todo o seu corpo e rosto com boa iluminação.",
    obs2Antes: "Segure um papel com a palavra ",
    obs2Depois: " e a data de hoje.",
    obs3: "O vídeo deve ter entre 10 e 15 segundos e no máximo 50MB.",
    comprimir: "Se o seu vídeo for maior que 50MB, comprima-o antes de enviar:",
    anteriorRecusado: "O vídeo anterior foi recusado",
    motivo: "Motivo:",
    graveOutro: "Grave outro e envie-o abaixo.",
    pendente: "Pendente de aprovação",
    recebido: "O seu vídeo foi recebido e está a ser analisado pela nossa equipa.",
    enviar: "Enviar vídeo",
  },
  en: {
    falhaUrl: "Could not prepare the upload.",
    erroDesconhecido: "Unknown error",
    erroUpload: (detalhe: string) => `Upload error: ${detalhe}`,
    falhaGuardar: "Could not save the video record.",
    demasiadoGrande: "Video too large",
    maximo50mb: "The video must be 50MB or less. Please compress it before sending.",
    formatoInvalido: "Invalid format",
    videoValido: "Please upload a valid video file.",
    aEnviar: "Sending video...",
    enviadoTitulo: "Video sent!",
    enviadoTexto: "Received. Our team will review it.",
    erro: "Error",
    erroEnviar: "Something went wrong while sending the video.",
    titulo: "360° video holding a piece of paper",
    obrigatorio: "Required",
    pedidoAntes: "Record a 360° video clearly showing your face and body, holding a piece of paper with the word ",
    pedidoDepois: " and today's date written on it.",
    observacoes: "Notes for the video:",
    obs1: "Show your whole body and face in good lighting.",
    obs2Antes: "Hold a piece of paper with the word ",
    obs2Depois: " and today's date.",
    obs3: "The video must be between 10 and 15 seconds long and 50MB or less.",
    comprimir: "If your video is larger than 50MB, compress it before sending:",
    anteriorRecusado: "Your previous video was not accepted",
    motivo: "Reason:",
    graveOutro: "Record another one and send it below.",
    pendente: "Pending approval",
    recebido: "We have received your video and our team is reviewing it.",
    enviar: "Send video",
  },
} as const;

/** Estado de cada peça da verificação (db/queries/verificacao.ts). */
export type EstadoPecaVerificacao = "por-enviar" | "pendente" | "aprovado" | "recusado";

async function uploadVideoToSupabase(
  file: File,
  locale: Locale,
): Promise<{ success: true } | { success: false; error: string }> {
  const t = TEXT[locale];
  const fileExtension = file.name.split(".").pop() || "mp4";
  const signedUrlResult = await getSignedUploadUrl("verification_video", fileExtension);

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

  const saveResult = await saveDocumentAfterUpload("verification_video", storagePath);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error ?? t.falhaGuardar };
  }

  return { success: true };
}

/**
 * Bloco do vídeo no passo da verificação. Mostra o estado (por enviar,
 * recebido, ou recusado com o motivo) e aceita um novo envio depois de uma
 * recusa. Quem segue para o passo seguinte é a página, por `onEnviado`.
 */
export function VideoVerificationForm({
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
  const [estado, setEstado] = React.useState(estadoInicial);
  const videoUploaded = estado === "pendente" || estado === "aprovado";
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleVideoUpload(file: File) {
    if (!isLoaded || !user?.id) return;

    if (file.size > MAX_VIDEO_SIZE) {
      toast({
        title: t.demasiadoGrande,
        description: t.maximo50mb,
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast({
        title: t.formatoInvalido,
        description: t.videoValido,
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(t.aEnviar);

    try {
      const result = await uploadVideoToSupabase(file, locale);

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
        if (inputRef.current) inputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: t.erro,
        description: error instanceof Error ? error.message : t.erroEnviar,
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setIsUploading(false);
      setUploadProgress("");
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
          {t.pedidoAntes}<span className="text-rose-500">"OneSugar"</span>{t.pedidoDepois}
        </p>
      </div>

      {/* Observations */}
      <div className="border-2 border-border rounded-xl p-6 space-y-4 bg-muted/40">
        <h2 className="text-lg font-bold">{t.observacoes}</h2>
        <ul className="space-y-2.5 text-base font-medium text-foreground/80">
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            {t.obs1}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            {t.obs2Antes}<strong>"OneSugar"</strong>{t.obs2Depois}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            {t.obs3}
          </li>
        </ul>

        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground font-medium">
            {t.comprimir}
            <span className="block mt-1">
              iPhone: <strong>Video Compress</strong> · Android: <strong>Video Compressor</strong> · Online: <strong>clideo.com</strong>
            </span>
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
            <p className="text-sm">{t.graveOutro}</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      {videoUploaded ? (
        <div className="flex flex-col items-center gap-3 py-10 border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
          <AlertCircle className="h-10 w-10 text-orange-500" />
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{t.pendente}</p>
          <p className="text-sm text-muted-foreground">{t.recebido}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoUpload(file);
            }}
            disabled={isUploading}
          />
          <Button
            type="button"
            size="lg"
            className="w-full text-base font-bold py-6"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {uploadProgress || t.aEnviar}
              </>
            ) : (
              <>
                <VideoIcon className="mr-2 h-5 w-5" />
                {t.enviar}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
