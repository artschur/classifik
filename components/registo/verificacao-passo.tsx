"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, FileText, Loader2, Send, ShieldCheck, Smartphone, Video, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAX_VIDEO_SIZE,
  uploadVideoToSupabase,
  type EstadoPecaVerificacao,
} from "@/components/video-verification-form";
import { MAX_FILE_SIZE, uploadDocumentToSupabase } from "@/components/document-upload-form";
import { skipVerification } from "@/app/actions/document-verification";
import {
  medirPasso,
  medirVerificacaoEnviada,
  medirVerificacaoErro,
  medirVerificacaoPulada,
} from "@/lib/ga-registo";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/components/locale-provider";
import { localizeHref } from "@/lib/i18n";

const TIPOS_DOCUMENTO = "image/jpeg,image/png,application/pdf";

const TEXT = {
  pt: {
    titulo: "Verificação",
    subtitulo: "O último passo para o selo de verificação OneSugar.",
    cartaoTitulo: "Verificação de identidade",
    opcional: "Opcional",
    cartaoTexto:
      "Para receber o selo de verificação, envie um vídeo curto e um documento. Leva poucos minutos e pode ser feito pelo telemóvel.",
    emAnaliseTitulo: "Verificação em análise",
    emAnaliseTexto: "Já recebemos o seu vídeo e documento. A nossa equipa está a analisá-los.",
    recusadaTitulo: "A verificação anterior não foi aceite",
    motivo: "Motivo:",
    verificar: "Verificar identidade",
    maisTarde: "Verificar mais tarde",
    continuar: "Continuar",
    janelaTitulo: "Verificar identidade",
    janelaDescricao: "Um vídeo curto e um documento. Só a nossa equipa os vê.",
    videoTitulo: "1. Vídeo 360°",
    videoTextoAntes: "Mostre o rosto e o corpo com boa iluminação, segurando um papel com ",
    videoTextoDepois: " e a data de hoje. 10 a 15 segundos, até 50MB.",
    videoBotao: "Gravar ou escolher vídeo",
    documentoTitulo: "2. Documento de identificação",
    documentoTexto:
      "Passaporte, Cartão de Cidadão, RG ou outro documento oficial que mostre que tem mais de 18 anos. JPG, PNG ou PDF, até 5MB.",
    documentoBotao: "Fotografar ou escolher documento",
    tipoPlaceholder: "Tipo de documento",
    passaporte: "Passaporte",
    identidade: "Cartão de Cidadão / RG",
    carta: "Carta de Condução / CNH",
    recebido: "Recebido. Em análise pela nossa equipa.",
    recusado: "O anterior não foi aceite. Envie outro.",
    privacidade:
      "Os ficheiros são encriptados e usados apenas para verificar a sua conta. Nunca os partilhamos com terceiros.",
    enviar: "Enviar para análise",
    aEnviar: "A enviar...",
    videoGrande: "O vídeo deve ter no máximo 50MB. Comprima-o antes de enviar.",
    videoFormato: "Escolha um ficheiro de vídeo.",
    documentoGrande: "O documento deve ter no máximo 5MB.",
    documentoFormato: "Envie o documento em JPG, PNG ou PDF.",
    ficheiroInvalido: "Ficheiro inválido",
    falhaEnvio: "Não foi possível enviar",
    tenteNovamente: "Tente novamente.",
    enviadoTitulo: "Verificação enviada",
    enviadoTexto: "A nossa equipa vai analisar o seu vídeo e documento.",
  },
  en: {
    titulo: "Verification",
    subtitulo: "The last step to get the OneSugar verified badge.",
    cartaoTitulo: "Identity verification",
    opcional: "Optional",
    cartaoTexto:
      "To get the verified badge, send a short video and an ID document. It only takes a few minutes and can be done from your phone.",
    emAnaliseTitulo: "Verification under review",
    emAnaliseTexto: "We have received your video and document. Our team is reviewing them.",
    recusadaTitulo: "Your previous verification was not accepted",
    motivo: "Reason:",
    verificar: "Verify my identity",
    maisTarde: "Verify later",
    continuar: "Continue",
    janelaTitulo: "Verify my identity",
    janelaDescricao: "A short video and an ID document. Only our team can see them.",
    videoTitulo: "1. 360° video",
    videoTextoAntes: "Show your face and body in good lighting, holding a piece of paper with ",
    videoTextoDepois: " and today's date. 10 to 15 seconds, up to 50MB.",
    videoBotao: "Record or choose a video",
    documentoTitulo: "2. ID document",
    documentoTexto:
      "Passport, Citizen Card, RG or another official document showing you are over 18. JPG, PNG or PDF, up to 5MB.",
    documentoBotao: "Take a photo or choose a document",
    tipoPlaceholder: "Document type",
    passaporte: "Passport",
    identidade: "Citizen Card / RG",
    carta: "Driving licence / CNH",
    recebido: "Received. Our team is reviewing it.",
    recusado: "The previous one was not accepted. Please send another.",
    privacidade:
      "Your files are encrypted and used only to verify your account. We never share them with third parties.",
    enviar: "Send for review",
    aEnviar: "Sending...",
    videoGrande: "The video must be 50MB or less. Please compress it before sending.",
    videoFormato: "Please choose a video file.",
    documentoGrande: "The document must be 5MB or less.",
    documentoFormato: "Please send the document as JPG, PNG or PDF.",
    ficheiroInvalido: "Invalid file",
    falhaEnvio: "We couldn't send it",
    tenteNovamente: "Please try again.",
    enviadoTitulo: "Verification sent",
    enviadoTexto: "Our team will review your video and document.",
  },
} as const;

type Textos = (typeof TEXT)[keyof typeof TEXT];

const enviada = (estado: EstadoPecaVerificacao) => estado === "pendente" || estado === "aprovado";

/**
 * Passo 4 do registo, e também para onde levam os avisos de verificação por
 * fazer. O perfil já existe e está na fila do admin, por isso a verificação é
 * opcional: o vídeo e o documento são enviados numa janela, e "Verificar mais
 * tarde" segue sem eles.
 *
 * `registo`: veio do passo 3. Segue para a página do perfil criado; fora do
 * registo volta ao painel.
 */
export function VerificacaoPasso({
  video,
  documento,
  motivoRecusa,
  registo,
}: {
  video: EstadoPecaVerificacao;
  documento: EstadoPecaVerificacao;
  motivoRecusa: string | null;
  registo: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = TEXT[locale];
  const [estadoVideo, setEstadoVideo] = React.useState(video);
  const [estadoDocumento, setEstadoDocumento] = React.useState(documento);
  const [janelaAberta, setJanelaAberta] = React.useState(false);
  const [aSair, setASair] = React.useState(false);

  const completa = enviada(estadoVideo) && enviada(estadoDocumento);
  const recusada = estadoVideo === "recusado" || estadoDocumento === "recusado";
  const destino = localizeHref(registo ? "/companions/register/criado" : "/profile", locale);

  // GA4: passo 4 do registo.
  React.useEffect(() => {
    if (registo) medirPasso(4);
  }, [registo]);

  const maisTarde = async () => {
    setASair(true);
    if (registo) {
      medirVerificacaoPulada();
      try {
        await skipVerification();
      } catch {
        // O evento é só para os lembretes do RD: não pode prendê-la aqui.
      }
    }
    router.push(destino);
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="space-y-1.5 p-6">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">{t.titulo}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitulo}</p>
      </div>

      <div className="space-y-6 px-6 pb-6">
        {completa ? (
          <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <Clock className="h-6 w-6 shrink-0 text-amber-500" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{t.emAnaliseTitulo}</p>
              <p className="text-muted-foreground">{t.emAnaliseTexto}</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 rounded-xl border p-4 md:p-5">
            <ShieldCheck className="h-8 w-8 shrink-0 text-rose-600" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{t.cartaoTitulo}</h2>
                <span className="rounded-full bg-rose-600/10 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {t.opcional}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{t.cartaoTexto}</p>
            </div>
          </div>
        )}

        {recusada && !completa && (
          <div className="flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="space-y-1">
              <p className="font-semibold">{t.recusadaTitulo}</p>
              {motivoRecusa && (
                <p className="text-muted-foreground">
                  <strong>{t.motivo}</strong> {motivoRecusa}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {completa ? (
            <Button
              size="lg"
              className="h-12 w-full text-base font-semibold"
              disabled={aSair}
              onClick={() => {
                setASair(true);
                router.push(destino);
              }}
            >
              {t.continuar}
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="h-12 w-full text-base font-semibold"
                disabled={aSair}
                onClick={() => setJanelaAberta(true)}
              >
                <Smartphone className="mr-2 h-5 w-5" />
                {t.verificar}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full text-base font-semibold"
                disabled={aSair}
                onClick={maisTarde}
              >
                {aSair ? <Loader2 className="h-5 w-5 animate-spin" /> : t.maisTarde}
              </Button>
            </>
          )}
        </div>
      </div>

      <JanelaVerificacao
        t={t}
        aberta={janelaAberta}
        setAberta={setJanelaAberta}
        estadoVideo={estadoVideo}
        estadoDocumento={estadoDocumento}
        onVideoEnviado={() => setEstadoVideo("pendente")}
        onDocumentoEnviado={() => setEstadoDocumento("pendente")}
        onConcluida={() => {
          setJanelaAberta(false);
          setASair(true);
          router.push(destino);
        }}
      />
    </div>
  );
}

function JanelaVerificacao({
  t,
  aberta,
  setAberta,
  estadoVideo,
  estadoDocumento,
  onVideoEnviado,
  onDocumentoEnviado,
  onConcluida,
}: {
  t: Textos;
  aberta: boolean;
  setAberta: (aberta: boolean) => void;
  estadoVideo: EstadoPecaVerificacao;
  estadoDocumento: EstadoPecaVerificacao;
  onVideoEnviado: () => void;
  onDocumentoEnviado: () => void;
  onConcluida: () => void;
}) {
  const locale = useLocale();
  const { toast } = useToast();
  const [video, setVideo] = React.useState<File | null>(null);
  const [documento, setDocumento] = React.useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = React.useState("");
  const [aEnviar, setAEnviar] = React.useState(false);

  const faltaVideo = !enviada(estadoVideo);
  const faltaDocumento = !enviada(estadoDocumento);
  const pronto =
    (!faltaVideo || video !== null) && (!faltaDocumento || (documento !== null && tipoDocumento !== ""));

  const invalido = (descricao: string) =>
    toast({ variant: "destructive", title: t.ficheiroInvalido, description: descricao });

  const escolherVideo = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      medirVerificacaoErro("video", "formato");
      return invalido(t.videoFormato);
    }
    if (f.size > MAX_VIDEO_SIZE) {
      medirVerificacaoErro("video", "tamanho");
      return invalido(t.videoGrande);
    }
    setVideo(f);
  };

  const escolherDocumento = (f: File | undefined) => {
    if (!f) return;
    if (!TIPOS_DOCUMENTO.split(",").includes(f.type)) {
      medirVerificacaoErro("documento", "formato");
      return invalido(t.documentoFormato);
    }
    if (f.size > MAX_FILE_SIZE) {
      medirVerificacaoErro("documento", "tamanho");
      return invalido(t.documentoGrande);
    }
    setDocumento(f);
  };

  const falhou = (peca: "video" | "documento", erro: unknown) => {
    medirVerificacaoErro(peca, "envio");
    toast({
      variant: "destructive",
      title: t.falhaEnvio,
      description: erro instanceof Error ? erro.message : typeof erro === "string" ? erro : t.tenteNovamente,
    });
  };

  // Um de cada vez: se o documento falhar, o vídeo já fica gravado e o
  // próximo clique só reenvia o que falta.
  const enviar = async () => {
    setAEnviar(true);
    try {
      if (faltaVideo && video) {
        const r = await uploadVideoToSupabase(video, locale).catch((e: unknown) => ({ success: false as const, error: e }));
        if (!r.success) return falhou("video", r.error);
        medirVerificacaoEnviada("video");
        onVideoEnviado();
      }
      if (faltaDocumento && documento) {
        const r = await uploadDocumentToSupabase(documento, tipoDocumento, locale).catch((e: unknown) => ({
          success: false as const,
          error: e,
        }));
        if (!r.success) return falhou("documento", r.error);
        medirVerificacaoEnviada("documento");
        onDocumentoEnviado();
      }
      toast({ variant: "success", title: t.enviadoTitulo, description: t.enviadoTexto });
      onConcluida();
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <Dialog open={aberta} onOpenChange={(v) => !aEnviar && setAberta(v)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.janelaTitulo}</DialogTitle>
          <DialogDescription>{t.janelaDescricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Peca
            icone={<Video className="h-5 w-5" />}
            titulo={t.videoTitulo}
            texto={
              <>
                {t.videoTextoAntes}
                <strong>&quot;OneSugar&quot;</strong>
                {t.videoTextoDepois}
              </>
            }
            estado={estadoVideo}
            t={t}
          >
            <EscolherFicheiro
              accept="video/*"
              nome={video?.name}
              botao={t.videoBotao}
              disabled={aEnviar}
              onEscolher={escolherVideo}
            />
          </Peca>

          <Peca
            icone={<FileText className="h-5 w-5" />}
            titulo={t.documentoTitulo}
            texto={t.documentoTexto}
            estado={estadoDocumento}
            t={t}
          >
            <Select value={tipoDocumento} onValueChange={setTipoDocumento} disabled={aEnviar}>
              <SelectTrigger>
                <SelectValue placeholder={t.tipoPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">{t.passaporte}</SelectItem>
                <SelectItem value="id_card">{t.identidade}</SelectItem>
                <SelectItem value="drivers_license">{t.carta}</SelectItem>
              </SelectContent>
            </Select>
            <EscolherFicheiro
              accept={TIPOS_DOCUMENTO}
              nome={documento?.name}
              botao={t.documentoBotao}
              disabled={aEnviar}
              onEscolher={escolherDocumento}
            />
          </Peca>

          <p className="text-xs text-muted-foreground">{t.privacidade}</p>
        </div>

        <DialogFooter>
          <Button
            size="lg"
            className="h-12 w-full text-base font-semibold"
            disabled={!pronto || aEnviar}
            onClick={enviar}
          >
            {aEnviar ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.aEnviar}
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                {t.enviar}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Peca({
  icone,
  titulo,
  texto,
  estado,
  t,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: React.ReactNode;
  estado: EstadoPecaVerificacao;
  t: Textos;
  children: React.ReactNode;
}) {
  const recebida = enviada(estado);
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-rose-600">{icone}</span>
        {titulo}
        {recebida && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
      </div>
      {recebida ? (
        <p className="text-sm text-muted-foreground">{t.recebido}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{texto}</p>
          {estado === "recusado" && <p className="text-sm font-medium text-red-500">{t.recusado}</p>}
          {children}
        </>
      )}
    </div>
  );
}

function EscolherFicheiro({
  accept,
  nome,
  botao,
  disabled,
  onEscolher,
}: {
  accept: string;
  nome: string | undefined;
  botao: string;
  disabled: boolean;
  onEscolher: (f: File | undefined) => void;
}) {
  return (
    <label
      className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm font-medium transition-colors ${
        disabled ? "opacity-60" : "cursor-pointer hover:border-rose-600/60 hover:bg-rose-600/5"
      }`}
    >
      {nome && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
      <span className="truncate">{nome ?? botao}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          onEscolher(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}
