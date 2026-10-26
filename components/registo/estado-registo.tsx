import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import { estadoDoRegisto, type EstadoRegisto as Estado } from "@/db/queries/verificacao";

type Contexto = "painel" | "edicao" | "anuncio" | "final";

const botao =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors";

function Cartao({
  tom,
  icone,
  titulo,
  children,
  acao,
}: {
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
            <Link href={acao.href} className={`${botao} ${corBotao} mt-2`}>
              {acao.texto}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function faltaNaVerificacao(estado: Estado) {
  const { video, documento } = estado.documentos;
  const enviada = (p: string) => p === "pendente" || p === "aprovado";
  if (!enviada(video) && !enviada(documento)) return "o vídeo e o documento de identificação";
  if (!enviada(video)) return "o vídeo";
  return "o documento de identificação";
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

  const cartoes: React.ReactNode[] = [];
  // Na edição, "Corrigir perfil" levaria à própria página.
  const naEdicao = contexto === "edicao";

  if (estado.recusado) {
    cartoes.push(
      <Cartao
        key="recusado"
        tom="vermelho"
        icone={<XCircle className="h-6 w-6" />}
        titulo="O seu perfil foi recusado"
        acao={naEdicao ? undefined : { href: "/companions/register", texto: "Corrigir perfil" }}
      >
        {estado.motivoRecusa && (
          <p>
            <strong>Motivo:</strong> {estado.motivoRecusa}
          </p>
        )}
        <p>
          Corrija o que for preciso e guarde o perfil: ele volta a ser analisado
          pela equipa.
        </p>
      </Cartao>,
    );
  }

  if (estado.verificacao === "recusada" || (estado.verificacao === "parcial" && estado.documentos.motivoRecusa)) {
    cartoes.push(
      <Cartao
        key="documentos-recusados"
        tom="vermelho"
        icone={<XCircle className="h-6 w-6" />}
        titulo="A sua verificação foi recusada"
        acao={{ href: "/companions/verification", texto: "Enviar novamente" }}
      >
        {estado.documentos.motivoRecusa && (
          <p>
            <strong>Motivo:</strong> {estado.documentos.motivoRecusa}
          </p>
        )}
        <p>
          Envie {faltaNaVerificacao(estado)} outra vez. Sem verificação, o seu
          perfil aparece como &quot;Não verificada&quot; e não pode escolher um plano.
        </p>
      </Cartao>,
    );
  } else if (estado.verificacao === "por-enviar" || estado.verificacao === "parcial") {
    cartoes.push(
      <Cartao
        key="verificacao"
        tom="ambar"
        icone={<AlertTriangle className="h-6 w-6" />}
        titulo="Falta finalizar a verificação"
        acao={{ href: "/companions/verification", texto: "Verificar agora" }}
      >
        <p>
          Falta enviar {faltaNaVerificacao(estado)}. Sem verificação, o seu perfil
          aparece como &quot;Não verificada&quot; e não pode escolher um plano.
        </p>
      </Cartao>,
    );
  } else if (estado.verificacao === "em-analise") {
    cartoes.push(
      <Cartao
        key="verificacao"
        tom="azul"
        icone={<Clock className="h-6 w-6" />}
        titulo="Verificação em análise"
      >
        <p>
          Recebemos o vídeo e o documento. Assim que a equipa confirmar, o seu
          perfil passa a ter o selo &quot;Verificada&quot;.
        </p>
      </Cartao>,
    );
  }

  if (estado.caracteristicasEmRevisao) {
    cartoes.push(
      <Cartao
        key="caracteristicas"
        tom="azul"
        icone={<Clock className="h-6 w-6" />}
        titulo="As suas características estão em revisão"
      >
        <p>Aparecem no anúncio assim que a equipa as aprovar.</p>
      </Cartao>,
    );
  } else if (estado.caracteristicasVazias) {
    cartoes.push(
      <Cartao
        key="caracteristicas"
        tom="ambar"
        icone={<ListChecks className="h-6 w-6" />}
        titulo="Finalize o seu registo"
        acao={{ href: "/companions/register/completar", texto: "Completar perfil" }}
      >
        <p>
          Acrescente as suas características (altura, cabelo, olhos...). É o que
          faz o seu anúncio aparecer nos filtros de quem procura.
        </p>
      </Cartao>,
    );
  }

  const situacao = estado.recusado
    ? null
    : !estado.aprovado
      ? { icone: <Clock className="h-4 w-4" />, texto: "Perfil em análise pela equipa. Ainda não está público." }
      : estado.pausado
        ? { icone: <Clock className="h-4 w-4" />, texto: "Anúncio pausado: não aparece no site." }
        : { icone: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, texto: "Anúncio no ar." };

  if (cartoes.length === 0 && !situacao) return null;

  return (
    <section
      aria-label="Estado do seu registo"
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
