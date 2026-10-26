"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import {
  VideoVerificationForm,
  type EstadoPecaVerificacao,
} from "@/components/video-verification-form";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { skipVerification } from "@/app/actions/document-verification";

const PASSO_SEGUINTE = "/companions/register/completar";

const enviada = (estado: EstadoPecaVerificacao) => estado === "pendente" || estado === "aprovado";

/**
 * Passo 4 do registo: vídeo e documento na mesma página. No ecrã continua a
 * ser obrigatório, mas o perfil já foi criado e está na fila do admin, por
 * isso dá para deixar para depois ("Pular por agora"), com os avisos a
 * lembrarem-na no painel, na edição e no próprio anúncio.
 */
export function VerificacaoPasso({
  video,
  documento,
  motivoRecusa,
}: {
  video: EstadoPecaVerificacao;
  documento: EstadoPecaVerificacao;
  motivoRecusa: string | null;
}) {
  const router = useRouter();
  const [estadoVideo, setEstadoVideo] = React.useState(video);
  const [estadoDocumento, setEstadoDocumento] = React.useState(documento);
  const [aPular, setAPular] = React.useState(false);

  const completa = enviada(estadoVideo) && enviada(estadoDocumento);

  const pular = async () => {
    setAPular(true);
    try {
      await skipVerification();
    } catch {
      // O evento é só para os lembretes do RD: não pode prendê-la aqui.
    }
    router.push(PASSO_SEGUINTE);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Verificação de identidade</h1>
        <p className="text-base text-muted-foreground">
          O seu perfil já foi criado e enviado para a nossa equipa. Falta
          confirmar que é mesmo você: um vídeo curto e um documento. É isto que
          dá ao seu anúncio o selo &quot;Verificada&quot;.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Exemplo de como gravar o seu vídeo:</p>
        <div className="w-full aspect-video">
          <iframe
            className="w-full h-full rounded-lg border shadow-sm"
            src="https://www.youtube-nocookie.com/embed/m5Tja4hJMXQ?autoplay=1&controls=0&mute=0&loop=1&playlist=m5Tja4hJMXQ&modestbranding=1&showinfo=0&rel=0"
            title="Vídeo de verificação"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <VideoVerificationForm
        estado={video}
        motivoRecusa={video === "recusado" ? motivoRecusa : null}
        onEnviado={() => setEstadoVideo("pendente")}
      />

      <DocumentUploadForm
        estado={documento}
        motivoRecusa={documento === "recusado" ? motivoRecusa : null}
        onEnviado={() => setEstadoDocumento("pendente")}
      />

      <div className="flex flex-col gap-3 border-t pt-8">
        <Button
          type="button"
          size="lg"
          className="w-full text-base font-bold py-6"
          disabled={!completa || aPular}
          onClick={() => router.push(PASSO_SEGUINTE)}
        >
          Continuar
        </Button>
        {!completa && (
          <p className="text-center text-sm text-muted-foreground">
            Envie o vídeo e o documento para continuar.
          </p>
        )}

        {!completa && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="mx-auto text-sm text-muted-foreground underline underline-offset-2"
                disabled={aPular}
              >
                {aPular ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pular por agora"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deixar a verificação para depois?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p>
                      Sem verificação, o seu perfil pode ir para o ar com o selo
                      &quot;Não verificada&quot;, e não pode escolher um plano.
                    </p>
                    <p>
                      Vai ver um aviso no seu painel até enviar o vídeo e o
                      documento.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Verificar agora</AlertDialogCancel>
                <AlertDialogAction onClick={pular}>Pular por agora</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
