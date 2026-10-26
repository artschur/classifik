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

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

/** Estado de cada peça da verificação (db/queries/verificacao.ts). */
export type EstadoPecaVerificacao = "por-enviar" | "pendente" | "aprovado" | "recusado";

async function uploadVideoToSupabase(
  file: File,
): Promise<{ success: true } | { success: false; error: string }> {
  const fileExtension = file.name.split(".").pop() || "mp4";
  const signedUrlResult = await getSignedUploadUrl("verification_video", fileExtension);

  if (!signedUrlResult.success) {
    return { success: false, error: signedUrlResult.error ?? "Falha ao gerar URL de upload." };
  }

  const { signedUrl, storagePath } = signedUrlResult;

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "Erro desconhecido");
    return { success: false, error: `Erro no upload: ${errorText}` };
  }

  const saveResult = await saveDocumentAfterUpload("verification_video", storagePath);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error ?? "Falha ao guardar registo do vídeo." };
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
  const [estado, setEstado] = React.useState(estadoInicial);
  const videoUploaded = estado === "pendente" || estado === "aprovado";
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleVideoUpload(file: File) {
    if (!isLoaded || !user?.id) return;

    if (file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "Vídeo demasiado grande",
        description: "O vídeo deve ter no máximo 50MB. Comprima-o antes de enviar.",
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um ficheiro de vídeo válido.",
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress("A enviar vídeo...");

    try {
      const result = await uploadVideoToSupabase(file);

      if (result.success) {
        setEstado("pendente");
        toast({
          title: "Vídeo enviado!",
          description: "Recebido. A equipa vai analisá-lo.",
          variant: "success",
        });
        onEnviado?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
        if (inputRef.current) inputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o vídeo.",
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
          <h2 className="text-2xl font-extrabold tracking-tight">Vídeo 360° com um papel</h2>
          <span className="bg-rose-600 text-white text-sm font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shrink-0">
            Obrigatório
          </span>
        </div>
        <p className="text-xl font-semibold leading-snug text-foreground">
          Grave um vídeo 360° mostrando claramente o seu rosto e corpo, segurando um papel com
          a palavra <span className="text-rose-500">"OneSugar"</span> e a data de hoje.
        </p>
      </div>

      {/* Observations */}
      <div className="border-2 border-border rounded-xl p-6 space-y-4 bg-muted/40">
        <h2 className="text-lg font-bold">Observações para o vídeo:</h2>
        <ul className="space-y-2.5 text-base font-medium text-foreground/80">
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            Mostre todo o seu corpo e rosto com boa iluminação.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            Segure um papel com a palavra <strong>"OneSugar"</strong> e a data de hoje.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            O vídeo deve ter entre 10 e 15 segundos e no máximo 50MB.
          </li>
        </ul>

        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground font-medium">
            Se o seu vídeo for maior que 50MB, comprima-o antes de enviar:
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
            <p className="font-bold">O vídeo anterior foi recusado</p>
            {motivoRecusa && (
              <p className="text-sm">
                <strong>Motivo:</strong> {motivoRecusa}
              </p>
            )}
            <p className="text-sm">Grave outro e envie-o abaixo.</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      {videoUploaded ? (
        <div className="flex flex-col items-center gap-3 py-10 border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
          <AlertCircle className="h-10 w-10 text-orange-500" />
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400">Pendente de aprovação</p>
          <p className="text-sm text-muted-foreground">O seu vídeo foi recebido e está a ser analisado pela nossa equipa.</p>
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
                {uploadProgress || "A enviar vídeo..."}
              </>
            ) : (
              <>
                <VideoIcon className="mr-2 h-5 w-5" />
                Enviar vídeo
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
