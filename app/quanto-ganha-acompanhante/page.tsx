import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import {
  Calculator,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Lightbulb,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { LeadCapture } from './lead-capture';

export const metadata: Metadata = {
  title: 'Quanto Ganha uma Acompanhante em Portugal? Calculadora | Onesugar',
  description:
    'Simule quanto pode ganhar como acompanhante em Portugal. Calculadora gratuita por valor/hora, atendimentos e dias de trabalho, com dicas para definir o seu preço.',
  alternates: {
    canonical: 'https://www.onesugar.pt/quanto-ganha-acompanhante',
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Quanto Ganha uma Acompanhante em Portugal? | Onesugar',
    description:
      'Calculadora gratuita de rendimentos para acompanhantes em Portugal.',
    url: 'https://www.onesugar.pt/quanto-ganha-acompanhante',
    siteName: 'Onesugar',
    locale: 'pt_PT',
    type: 'website',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.onesugar.pt' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Quanto ganha uma acompanhante',
      item: 'https://www.onesugar.pt/quanto-ganha-acompanhante',
    },
  ],
};

const faqs = [
  {
    q: 'Quanto ganha uma acompanhante em Portugal?',
    a: 'Não existe um valor único: o rendimento depende do valor cobrado por encontro, do número de atendimentos e dos dias trabalhados por semana. Na Onesugar, os valores por hora praticados situam-se tipicamente entre 150 € e 1 500 €, consoante o distrito, a experiência e o posicionamento de cada anunciante. A calculadora nesta página permite simular cenários com os seus próprios números.',
  },
  {
    q: 'A Onesugar cobra comissão sobre os encontros?',
    a: 'Não. 100% do valor combinado em cada encontro é da acompanhante. A Onesugar não intermedeia pagamentos nem retém qualquer percentagem. A plataforma cobra apenas planos opcionais de destaque, para quem quer mais visibilidade no seu distrito.',
  },
  {
    q: 'Preciso de pagar para criar o meu anúncio?',
    a: 'Não. Criar o perfil e publicar o anúncio é gratuito, com até 10 fotografias ou vídeos. Os planos pagos (Clássico, Plus e VIP) são opcionais e servem para obter posição de maior destaque nas listagens e no carrossel do distrito.',
  },
  {
    q: 'O que influencia o valor que posso cobrar?',
    a: 'Os fatores com mais peso são o distrito onde atende (a procura em Lisboa e Porto é maior do que em distritos do interior), a qualidade e actualidade das fotografias, o quão completo está o perfil, o tempo de resposta às mensagens e as avaliações recebidas. Perfis verificados e completos tendem a sustentar valores mais altos.',
  },
  {
    q: 'A simulação é uma garantia de rendimento?',
    a: 'Não. A calculadora é uma projeção matemática dos valores que introduzir e não constitui promessa nem garantia de ganhos. Os rendimentos reais variam com a procura, a sazonalidade, a disponibilidade e a concorrência no distrito.',
  },
  {
    q: 'Tenho de declarar estes rendimentos?',
    a: 'Os rendimentos obtidos por atividade independente estão sujeitos às obrigações fiscais em vigor em Portugal. A Onesugar não presta aconselhamento fiscal — recomendamos que consulte um contabilista certificado para perceber o enquadramento aplicável ao seu caso.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

function SectionTitle({
  id,
  title,
  icon,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-rose-500">{icon}</span>
        </div>
      )}
      <h2 id={id} className="text-2xl font-bold text-foreground scroll-mt-24 pt-1">
        {title}
      </h2>
    </div>
  );
}

export default function QuantoGanhaAcompanhantePage() {
  return (
    <>
      <Script
        id="schema-breadcrumb-calc"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="schema-faq-calc"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Quanto ganha uma acompanhante</span>
        </nav>

        {/* ── HERO + CALCULADORA ── */}
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12 items-start">
          <div className="mb-10 lg:mb-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Quanto ganha uma{' '}
              <span className="text-rose-500">acompanhante</span> em Portugal?
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
              Depende de quanto cobra, de quantos encontros faz e de quantos dias
              trabalha por semana. Use a calculadora para simular o seu cenário —
              e lembre-se: na Onesugar,{' '}
              <strong className="text-foreground font-medium">
                100% do valor de cada encontro é seu
              </strong>
              .
            </p>

            <div className="grid grid-cols-3 gap-3 mt-8 max-w-lg">
              {[
                { value: '0 €', label: 'para criar o anúncio' },
                { value: '100%', label: 'do valor é seu' },
                { value: '18', label: 'distritos cobertos' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-card px-3 py-4 text-center"
                >
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <LeadCapture />
          </div>
        </div>

        <hr className="border-border my-14" />

        {/* ── COMO FUNCIONA O CÁLCULO ── */}
        <section>
          <SectionTitle
            id="como-funciona"
            title="Como funciona o cálculo"
            icon={<Calculator className="h-4 w-4" />}
          />
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            A simulação usa uma fórmula simples e transparente, sem descontos
            escondidos, porque a Onesugar não retém qualquer percentagem:
          </p>

          <div className="rounded-xl border border-border bg-card px-5 py-4 mb-6 overflow-x-auto">
            <code className="text-sm text-foreground whitespace-nowrap">
              valor por encontro × encontros por dia × dias por semana × 4 semanas
            </code>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <TrendingUp className="h-4 w-4" />,
                title: 'Valor por encontro',
                desc: 'O que cobra por cada atendimento. É a variável com mais impacto no resultado final.',
              },
              {
                icon: <Clock className="h-4 w-4" />,
                title: 'Ritmo de trabalho',
                desc: 'Quantos encontros aceita por dia e quantos dias trabalha. Define o volume.',
              },
              {
                icon: <ShieldCheck className="h-4 w-4" />,
                title: 'Sem comissões',
                desc: 'A plataforma não fica com nada do valor combinado. O que cobra é o que recebe.',
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
                  {c.icon}
                </div>
                <p className="font-semibold text-sm text-foreground mb-1">{c.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6 max-w-2xl">
            O resultado é uma projeção com um mês cheio de trabalho ao ritmo que
            indicou. Na prática, poucas semanas são idênticas — vale a pena
            simular também um cenário conservador, com menos dias, para perceber
            o intervalo realista.
          </p>
        </section>

        <hr className="border-border my-14" />

        {/* ── MERCADO EM PORTUGAL ── */}
        <section>
          <SectionTitle
            id="mercado-portugal"
            title="O mercado em Portugal"
            icon={<MapPin className="h-4 w-4" />}
          />
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            <p>
              Portugal não tem um mercado uniforme. A procura concentra-se nos
              grandes centros urbanos e nas zonas com maior fluxo de turismo e
              negócios, o que se reflete diretamente nos valores praticados e na
              frequência de contactos.
            </p>
            <p>
              <strong className="text-foreground font-medium">
                Lisboa e Porto
              </strong>{' '}
              concentram o maior volume de procura ao longo de todo o ano, com
              valores por hora tipicamente acima da média nacional.{' '}
              <strong className="text-foreground font-medium">
                Faro e o Algarve
              </strong>{' '}
              têm um padrão fortemente sazonal, com picos claros no verão.
              Distritos do interior, como{' '}
              <strong className="text-foreground font-medium">
                Guarda, Bragança ou Portalegre
              </strong>
              , têm menor volume — mas também muito menos concorrência, o que pode
              compensar para quem já tem clientela estabelecida.
            </p>
            <p>
              A sazonalidade pesa mais do que a maioria das pessoas espera. Além
              do verão algarvio, períodos de férias, feriados prolongados e
              grandes eventos em Lisboa e Porto alteram significativamente o
              volume de contactos numa mesma semana.
            </p>
            <p>
              Por fim, a verificação faz diferença competitiva. Num mercado onde
              perfis falsos são uma queixa recorrente de quem procura, um perfil
              com identidade confirmada parte de uma posição de confiança mais
              forte — e isso reflete-se na disposição para pagar.
            </p>
          </div>
        </section>

        <hr className="border-border my-14" />

        {/* ── DICAS ── */}
        <section>
          <SectionTitle
            id="dicas"
            title="Como aumentar o seu rendimento"
            icon={<Lightbulb className="h-4 w-4" />}
          />
          <div className="space-y-3 max-w-2xl">
            {[
              {
                title: 'Complete o perfil por inteiro',
                desc: 'Perfis com todas as características preenchidas aparecem em mais filtros de pesquisa. Cada campo vazio é uma pesquisa em que não aparece.',
              },
              {
                title: 'Invista nas fotografias',
                desc: 'Boa iluminação (de preferência natural), fundo limpo e variedade de poses. É o primeiro e muitas vezes o único critério de decisão.',
              },
              {
                title: 'Escreva uma descrição curta que diferencie',
                desc: 'É o texto que aparece na listagem, antes de alguém abrir o perfil. Use-o para comunicar o que a distingue, não para repetir o óbvio.',
              },
              {
                title: 'Responda rápido',
                desc: 'O tempo de resposta é frequentemente o que decide entre si e outro perfil. Contactos sem resposta são rendimento perdido.',
              },
              {
                title: 'Posicione o preço com intenção',
                desc: 'Preço demasiado baixo não gera necessariamente mais volume, e desvaloriza o posicionamento. Observe o praticado no seu distrito e ajuste com critério.',
              },
              {
                title: 'Considere um plano de destaque quando fizer sentido',
                desc: 'Se já tem perfil completo e boas fotografias mas pouco volume, o problema costuma ser visibilidade — é aí que um plano pago se paga a si próprio.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-border my-14" />

        {/* ── FAQ ── */}
        <section>
          <SectionTitle
            id="faq"
            title="Perguntas frequentes sobre ganhos"
            icon={<HelpCircle className="h-4 w-4" />}
          />
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border max-w-2xl">
            {faqs.map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer select-none text-sm font-medium text-foreground hover:bg-muted/30 transition-colors list-none">
                  {item.q}
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Dúvidas sobre o processo de registo, fotografias ou verificação?{' '}
            <Link
              href="/ajuda-anunciantes"
              className="text-rose-500 hover:underline font-medium"
            >
              Veja o guia completo para anunciantes
            </Link>
            .
          </p>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="mt-14 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-6 py-10 text-center">
          <h2 className="text-2xl font-bold mb-2">Pronta para começar?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Criar o anúncio é gratuito e leva poucos minutos. Só paga se quiser
            mais destaque no seu distrito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/companions/register"
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Criar anúncio grátis
            </Link>
            <Link
              href="/checkout"
              className="w-full sm:w-auto border border-border hover:bg-muted text-foreground font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Ver planos
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
