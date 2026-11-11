import { AlertTriangle, CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import { estadoDoRegisto, type EstadoRegisto as Estado } from "@/db/queries/verificacao";
import { LocaleLink } from "@/components/locale-link";
import { getLocale } from "@/lib/locale.server";
import type { Locale } from "@/lib/i18n";

type Contexto = "painel" | "edicao" | "anuncio" | "final";

// O motivo de uma recusa é escrito pelo admin e aparece como foi escrito.
const TEXT = {
  pt: {
    motivo: "Motivo:",
    perfilRecusado: "O seu perfil foi recusado",
    corrigirPerfil: "Corrigir perfil",
    corrijaEGuarde:
      "Corrija o que for preciso e guarde o perfil: ele volta a ser analisado pela equipa.",
    verificacaoRecusada: "A sua verificação foi recusada",
    enviarNovamente: "Enviar novamente",
    envieOutraVez: (falta: string) =>
      `Envie ${falta} outra vez. Sem verificação, o seu perfil aparece como "Não verificada" e não pode escolher um plano.`,
    faltaFinalizar: "Falta finalizar a verificação",
    verificarAgora: "Verificar agora",
    faltaEnviar: (falta: string) =>
      `Falta enviar ${falta}. Sem verificação, o seu perfil aparece como "Não verificada" e não pode escolher um plano.`,
    emAnalise: "Verificação em análise",
    recebemos:
      'Recebemos o vídeo e o documento. Assim que a equipa confirmar, o seu perfil passa a ter o selo "Verificada".',
    caracteristicasEmRevisao: "As suas características estão em revisão",
    aparecemNoAnuncio: "Aparecem no anúncio assim que a equipa as aprovar.",
    finalizeRegisto: "Finalize o seu registo",
    completarPerfil: "Completar perfil",
    acrescente:
      "Acrescente as suas características (altura, cabelo, olhos...). É o que faz o seu anúncio aparecer nos filtros de quem procura.",
    perfilEmAnalise: "Perfil em análise pela equipa. Ainda não está público.",
    anuncioPausado: "Anúncio pausado: não aparece no site.",
    anuncioNoAr: "Anúncio no ar.",
    estadoDoRegisto: "Estado do seu registo",
    faltaAmbos: "o vídeo e o documento de identificação",
    faltaVideo: "o vídeo",
    faltaDocumento: "o documento de identificação",
  },
  en: {
    motivo: "Reason:",
    perfilRecusado: "Your profile was not approved",
    corrigirPerfil: "Fix profile",
    corrijaEGuarde:
      "Fix what is needed and save your profile: our team will review it again.",
    verificacaoRecusada: "Your verification was not accepted",
    enviarNovamente: "Send again",
    envieOutraVez: (falta: string) =>
      `Please send ${falta} again. Without verification, your profile shows as "Not verified" and you can't choose a plan.`,
    faltaFinalizar: "Finish your verification",
    verificarAgora: "Verify now",
    faltaEnviar: (falta: string) =>
      `You still need to send ${falta}. Without verification, your profile shows as "Not verified" and you can't choose a plan.`,
    emAnalise: "Verification under review",
    recebemos:
      'We have received the video and the document. As soon as our team confirms them, your profile gets the "Verified" badge.',
    caracteristicasEmRevisao: "Your details are under review",
    aparecemNoAnuncio: "They will appear on your listing as soon as our team approves them.",
    finalizeRegisto: "Finish your registration",
    completarPerfil: "Complete profile",
    acrescente:
      "Add your details (height, hair, eyes...). This is what makes your listing show up in the filters people use to search.",
    perfilEmAnalise: "Profile under review by our team. It is not public yet.",
    anuncioPausado: "Listing paused: it does not appear on the site.",
    anuncioNoAr: "Listing live.",
    estadoDoRegisto: "Your registration status",
    faltaAmbos: "the video and the ID document",
    faltaVideo: "the video",
    faltaDocumento: "the ID document",
  },
} as const;

const botao =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors";

function Cartao({
  locale,
  tom,
  icone,
  titulo,
  children,
  acao,
}: {
  locale: Locale;
  tom: "vermelho" | "ambar" | "azul";
  icone: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
  acao?: { href: string; texto: string };
}) {
  const cores = {
    vermelho:
      "border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
    ambar:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    azul: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  }[tom];
  const corBotao = {
    vermelho: "bg-red-600 text-white hover:bg-red-700",
    ambar: "bg-amber-600 text-white hover:bg-amber-700",
    azul: "bg-sky-600 text-white hover:bg-sky-700",
  }[tom];

  return (
    <div className={`rounded-xl border-2 p-5 ${cores}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icone}</span>
        <div className="flex-1 space-y-2">
          <p className="text-lg font-bold leading-snug">{titulo}</p>
          <div className="space-y-1 text-sm leading-relaxed">{children}</div>
          {acao && (
            <LocaleLink locale={locale} href={acao.href} className={`${botao} ${corBotao} mt-2`}>
              {acao.texto}
            </LocaleLink>
          )}
        </div>
      </div>
    </div>
  );
}

function faltaNaVerificacao(estado: Estado, locale: Locale) {
  const t = TEXT[locale];
  const { video, documento } = estado.documentos;
  const enviada = (p: string) => p === "pendente" || p === "aprovado";
  if (!enviada(video) && !enviada(documento)) return t.faltaAmbos;
  if (!enviada(video)) return t.faltaVideo;
  return t.faltaDocumento;
}

/**
 * Avisos grandes para a anunciante: perfil recusado, verificação por fazer ou
 * recusada, características por preencher, e o estado do anúncio. Aparece no
 * painel, na edição, no próprio anúncio e no fim do registo.
 */
export async function EstadoRegisto({
  clerkId,
  contexto,
  centrado = true,
}: {
  clerkId: string;
  contexto: Contexto;
  /** O painel alinha tudo à esquerda; as outras páginas centram. */
  centrado?: boolean;
}) {
  const estado = await estadoDoRegisto(clerkId);
  if (!estado) return null;

  const locale = await getLocale();
  const t = TEXT[locale];

  const cartoes: React.ReactNode[] = [];
  // Na edição, "Corrigir perfil" levaria à própria página.
  const naEdicao = contexto === "edicao";

  if (estado.recusado) {
    cartoes.push(
      <Cartao
        key="recusado"
        locale={locale}
        tom="vermelho"
        icone={<XCircle className="h-6 w-6" />}
        titulo={t.perfilRecusado}
        acao={naEdicao ? undefined : { href: "/companions/register", texto: t.corrigirPerfil }}
      >
        {estado.motivoRecusa && (
          <p>
            <strong>{t.motivo}</strong> {estado.motivoRecusa}
          </p>
        )}
        <p>{t.corrijaEGuarde}</p>
      </Cartao>,
    );
  }

  if (estado.verificacao === "recusada" || (estado.verificacao === "parcial" && estado.documentos.motivoRecusa)) {
    cartoes.push(
      <Cartao
        key="documentos-recusados"
        locale={locale}
        tom="vermelho"
        icone={<XCircle className="h-6 w-6" />}
        titulo={t.verificacaoRecusada}
        acao={{ href: "/companions/verification", texto: t.enviarNovamente }}
      >
        {estado.documentos.motivoRecusa && (
          <p>
            <strong>{t.motivo}</strong> {estado.documentos.motivoRecusa}
          </p>
        )}
        <p>{t.envieOutraVez(faltaNaVerificacao(estado, locale))}</p>
      </Cartao>,
    );
  } else if (estado.verificacao === "por-enviar" || estado.verificacao === "parcial") {
    cartoes.push(
      <Cartao
        key="verificacao"
        locale={locale}
        tom="ambar"
        icone={<AlertTriangle className="h-6 w-6" />}
        titulo={t.faltaFinalizar}
        acao={{ href: "/companions/verification", texto: t.verificarAgora }}
      >
        <p>{t.faltaEnviar(faltaNaVerificacao(estado, locale))}</p>
      </Cartao>,
    );
  } else if (estado.verificacao === "em-analise") {
    cartoes.push(
      <Cartao
        key="verificacao"
        locale={locale}
        tom="azul"
        icone={<Clock className="h-6 w-6" />}
        titulo={t.emAnalise}
      >
        <p>{t.recebemos}</p>
      </Cartao>,
    );
  }

  if (estado.caracteristicasEmRevisao) {
    cartoes.push(
      <Cartao
        key="caracteristicas"
        locale={locale}
        tom="azul"
        icone={<Clock className="h-6 w-6" />}
        titulo={t.caracteristicasEmRevisao}
      >
        <p>{t.aparecemNoAnuncio}</p>
      </Cartao>,
    );
  } else if (estado.caracteristicasVazias) {
    cartoes.push(
      <Cartao
        key="caracteristicas"
        locale={locale}
        tom="ambar"
        icone={<ListChecks className="h-6 w-6" />}
        titulo={t.finalizeRegisto}
        acao={{ href: "/companions/register/completar", texto: t.completarPerfil }}
      >
        <p>{t.acrescente}</p>
      </Cartao>,
    );
  }

  const situacao = estado.recusado
    ? null
    : !estado.aprovado
      ? { icone: <Clock className="h-4 w-4" />, texto: t.perfilEmAnalise }
      : estado.pausado
        ? { icone: <Clock className="h-4 w-4" />, texto: t.anuncioPausado }
        : { icone: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, texto: t.anuncioNoAr };

  if (cartoes.length === 0 && !situacao) return null;

  return (
    <section
      aria-label={t.estadoDoRegisto}
      className={`mb-6 w-full max-w-3xl space-y-3 ${centrado ? "mx-auto" : ""}`}
    >
      {situacao && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {situacao.icone}
          {situacao.texto}
        </p>
      )}
      {cartoes}
    </section>
  );
}
