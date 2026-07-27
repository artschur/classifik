import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Camera,
  FileVideo,
  ShieldCheck,
  ThumbsUp,
  Lightbulb,
  HelpCircle,
  Headphones,
} from 'lucide-react';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { TocMobile, TocDesktop } from './toc';

export const metadata: Metadata = {
  title: 'Ajuda para Anunciantes | Onesugar',
  description: 'Guia completo para criar e publicar o teu perfil na Onesugar: registo, fotos, vídeo de verificação, aprovação e perguntas frequentes.',
  alternates: {
    canonical: 'https://www.onesugar.pt/ajuda-anunciantes',
  },
  openGraph: {
    title: 'Ajuda para Anunciantes | Onesugar',
    description: 'Guia completo para criar e publicar o teu perfil na Onesugar.',
    url: 'https://www.onesugar.pt/ajuda-anunciantes',
    type: 'article',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.onesugar.pt' },
    { '@type': 'ListItem', position: 2, name: 'Ajuda para Anunciantes', item: 'https://www.onesugar.pt/ajuda-anunciantes' },
  ],
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Como publicar o teu perfil na Onesugar',
  description: 'Guia passo a passo para criar, verificar e publicar o teu perfil de anunciante na plataforma Onesugar.',
  step: [
    { '@type': 'HowToStep', name: 'Como fazer o registo', url: 'https://www.onesugar.pt/ajuda-anunciantes#registo', text: 'Acede a onesugar.pt/companions/register, cria uma conta com e-mail e palavra-passe, confirma o e-mail e preenche o formulário de 4 passos.' },
    { '@type': 'HowToStep', name: 'Como criar o anúncio', url: 'https://www.onesugar.pt/ajuda-anunciantes#criar-anuncio', text: 'Preenche o formulário de 4 passos: Informações, Características, Localização e Fotos.' },
    { '@type': 'HowToStep', name: 'Como enviar as fotografias', url: 'https://www.onesugar.pt/ajuda-anunciantes#fotografias', text: 'Envia entre 1 e 10 fotos ou vídeos (até 30 nos planos pagos). Formatos aceites: JPG, PNG, WebP, MP4.' },
    { '@type': 'HowToStep', name: 'Como gravar o vídeo de verificação 360°', url: 'https://www.onesugar.pt/ajuda-anunciantes#video-verificacao', text: 'Grava um vídeo de 10 a 15 segundos segurando um papel com "OneSugar" e a data de hoje, mostrando o rosto e o corpo com boa iluminação. Máx. 50 MB.' },
    { '@type': 'HowToStep', name: 'Como funciona a verificação', url: 'https://www.onesugar.pt/ajuda-anunciantes#verificacao', text: 'Envia o vídeo de verificação e um documento de identificação. A equipa verifica correspondência facial, maioridade e autenticidade.' },
    { '@type': 'HowToStep', name: 'Como funciona a aprovação', url: 'https://www.onesugar.pt/ajuda-anunciantes#aprovacao', text: 'Após a revisão, o perfil é aprovado (fica visível) ou rejeitado (recebes e-mail com motivos e podes corrigir e reativar).' },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Quanto tempo demora até o meu perfil aparecer?', acceptedAnswer: { '@type': 'Answer', text: 'De alguns minutos a algumas horas, dependendo do volume de pedidos. Em horário de suporte (08h00–18h00) o tempo é tipicamente mais curto.' } },
    { '@type': 'Question', name: 'O meu vídeo de verificação foi rejeitado. O que faço?', acceptedAnswer: { '@type': 'Answer', text: 'Regrava o vídeo seguindo as instruções enviadas por e-mail ou WhatsApp. Certifica-te de que a data está legível, que seguras o papel com "OneSugar" e que o rosto e o corpo estão claramente visíveis com boa iluminação.' } },
    { '@type': 'Question', name: 'Posso editar o meu anúncio depois de publicado?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. Podes editar toda e qualquer informação — texto, fotos, vídeos e preço — a qualquer momento, sem precisares de criar um novo perfil.' } },
    { '@type': 'Question', name: 'Quantas fotos posso ter no perfil?', acceptedAnswer: { '@type': 'Answer', text: 'No plano gratuito podes ter até 10 fotos e vídeos. Nos planos pagos (Classic, Plus, VIP) o limite sobe para 30 fotos e vídeos.' } },
    { '@type': 'Question', name: 'O meu documento não está a ser aceite. O que faço?', acceptedAnswer: { '@type': 'Answer', text: 'Documentos aceites: Passaporte, Cartão de Cidadão / RG, Carta de Condução / CNH. O ficheiro deve estar em formato JPG, PNG ou PDF e ter no máximo 5 MB.' } },
    { '@type': 'Question', name: 'O registo é gratuito?', acceptedAnswer: { '@type': 'Answer', text: 'Sim, criar um perfil na Onesugar é completamente gratuito. Para teres mais visibilidade e fechar mais clientes, existem planos pagos.' } },
    { '@type': 'Question', name: 'A Onesugar partilha os meus dados com terceiros?', acceptedAnswer: { '@type': 'Answer', text: 'Não. Os dados enviados (vídeo e documento) são utilizados exclusivamente para verificação de identidade e não são partilhados com terceiros.' } },
    { '@type': 'Question', name: 'Posso ter mais do que um perfil com o mesmo e-mail?', acceptedAnswer: { '@type': 'Answer', text: 'Não. Cada conta está vinculada a um e-mail — 1 e-mail = 1 conta. Criar múltiplas contas pode resultar em suspensão permanente.' } },
  ],
};


function SectionTitle({ eyebrow, title, icon }: { eyebrow: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-primary">{icon}</span>
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-0.5">{eyebrow}</p>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function Steps({ steps }: { steps: { title: string; desc: React.ReactNode }[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 z-10">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px bg-border flex-1 my-1" style={{ minHeight: '20px' }} />
            )}
          </div>
          <div className={`pb-5 ${i < steps.length - 1 ? '' : ''}`}>
            <p className="font-semibold text-sm text-foreground leading-7">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldList({ fields }: { fields: { name: string; rule: string; req: boolean }[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {fields.map((f) => (
        <div key={f.name} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
            {f.rule !== '—' && <p className="text-xs text-muted-foreground mt-0.5">{f.rule}</p>}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${f.req ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {f.req ? 'obrig.' : 'opc.'}
          </span>
        </div>
      ))}
    </div>
  );
}

function CheckList({ items, ok }: { items: string[]; ok: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          {ok
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          }
          <span className="text-muted-foreground leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-foreground">
      <span className="text-amber-500 mt-0.5 flex-shrink-0">💡</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-border my-10" />;
}

export default function AjudaAnunciantesPage() {
  return (
    <>
      <Script id="schema-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="schema-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <TocMobile />

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Ajuda para Anunciantes</span>
        </nav>

        <div className="md:grid md:grid-cols-[200px_1fr] md:gap-12">

          <TocDesktop />

          {/* Content */}
          <main className="min-w-0">

            {/* Hero */}
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Guia para Anunciantes</h1>
              <p className="text-muted-foreground text-base max-w-lg">
                Tudo o que precisas de saber para criar, verificar e publicar o teu perfil na Onesugar.
              </p>
            </div>

            {/* 1. REGISTO */}
            <section id="registo" className="scroll-mt-24">
              <SectionTitle eyebrow="01" title="Como fazer o registo" icon={<ShieldCheck className="h-4 w-4" />} />
              <Steps steps={[
                { title: 'Acede à página de registo', desc: <span>Vai a <strong className="text-foreground font-medium">onesugar.pt/companions/register</strong></span> },
                { title: 'Cria uma conta', desc: 'Se ainda não tens conta, clica em "Criar conta". O registo é feito com e-mail e palavra-passe.' },
                { title: 'Confirma o e-mail', desc: 'Se for pedido, confirma o endereço de e-mail através do link enviado para a tua caixa de entrada.' },
                { title: 'Preenche o formulário de perfil', desc: <span>Depois de autenticada, és redirecionada para o formulário de criação de perfil com <strong className="text-foreground font-medium">4 passos</strong>: Informações, Características, Localização e Fotos.</span> },
                { title: 'Verificação de identidade', desc: 'Depois de adicionares a primeira foto, serás direcionada para a verificação de identidade (vídeo e documento). Não é necessária verificação de telemóvel no registo.' },
              ]} />
            </section>

            <Divider />

            {/* 2. CRIAR ANÚNCIO */}
            <section id="criar-anuncio" className="scroll-mt-24">
              <SectionTitle eyebrow="02" title="Como criar o anúncio" />
              <p className="text-sm text-muted-foreground mb-6">O formulário tem 4 passos que devem ser completados por ordem. Podes editar o anúncio a qualquer momento depois de submetido.</p>

              <p className="text-sm font-semibold text-foreground mb-3">Passo 1 — Informações</p>
              <FieldList fields={[
                { name: 'Nome artístico', rule: 'mín. 2 caracteres', req: true },
                { name: 'Número de telefone', rule: 'mín. 8 caracteres', req: true },
                { name: 'Descrição curta', rule: 'máx. 60 caracteres', req: true },
                { name: 'Descrição completa', rule: 'mín. 30 e máx. 350 caracteres', req: true },
                { name: 'Preço por hora', rule: 'valor numérico em €', req: true },
                { name: 'Idade', rule: 'de 18 a 40+ anos', req: true },
                { name: 'Género', rule: 'Masculino / Feminino / Outro', req: true },
                { name: 'Línguas faladas', rule: 'mín. 1 opção', req: true },
                { name: 'Instagram', rule: '—', req: false },
                { name: 'Identidade de género', rule: 'Cisgénero / Transgénero / Outro', req: false },
              ]} />

              <p className="text-sm font-semibold text-foreground mt-6 mb-3">Passo 2 — Características</p>
              <FieldList fields={[
                { name: 'Peso (kg)', rule: 'mín. 30 kg', req: true },
                { name: 'Altura (m)', rule: '1,30 m a 2,50 m', req: true },
                { name: 'Etnia', rule: 'Branco / Negro / Latino / Asiático', req: true },
                { name: 'Cor do cabelo', rule: 'Loiro / Castanho / Preto / …', req: true },
                { name: 'Cor dos olhos', rule: 'Azul / Verde / Castanho / Preto', req: false },
                { name: 'Tamanho do cabelo', rule: 'Curto / Médio / Longo / Muito Longo', req: false },
                { name: 'Tamanho do pé (EU)', rule: '—', req: false },
                { name: 'Silicone / Tatuagens / Piercings / Fumante', rule: 'Sim / Não', req: false },
              ]} />

              <p className="text-sm font-semibold text-foreground mt-6 mb-3">Passo 3 — Localização</p>
              <FieldList fields={[
                { name: 'Distrito', rule: 'selecção da lista', req: true },
                { name: 'Concelho', rule: 'texto livre', req: true },
                { name: 'Atende em hotel', rule: 'Sim / Não', req: false },
                { name: 'Atende em local próprio', rule: 'Sim / Não', req: false },
              ]} />

              <p className="text-sm text-muted-foreground mt-6">
                <strong className="text-foreground font-medium">Passo 4 — Fotos</strong>{' '}
                ver secção <a href="#fotografias" className="text-primary hover:underline">Fotografias</a>.
              </p>
            </section>

            <Divider />

            {/* 3. FOTOGRAFIAS */}
            <section id="fotografias" className="scroll-mt-24">
              <SectionTitle eyebrow="03" title="Como enviar as fotografias" icon={<Camera className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-6">As fotos são enviadas no Passo 4 do formulário, ou na área de edição do perfil a qualquer momento.</p>

              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">1</p>
                  <p className="text-xs text-muted-foreground mt-1">foto mínima para criar o perfil</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">10</p>
                  <p className="text-xs text-muted-foreground mt-1">fotos/vídeos no plano gratuito</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">30</p>
                  <p className="text-xs text-muted-foreground mt-1">fotos/vídeos nos planos pagos</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card px-4 py-4 mb-5 text-sm space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Formatos e limites</p>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Formatos aceites</span>
                  <span className="text-foreground font-medium">JPG, PNG, WebP, MP4</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Compressão automática</span>
                  <span className="text-foreground font-medium">até 2 MB · máx. 1920 px</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground">Vídeos curtos</span>
                  <span className="text-foreground font-medium">MP4 · máx. 50 MB</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-foreground mb-3">Motivos de rejeição de fotografias</p>
              <CheckList ok={false} items={[
                'Marca de água visível',
                'Contacto visível (número, e-mail, redes sociais)',
                'Qualidade baixa ou imagem desfocada',
                'Menor de idade',
                'A pessoa na foto não condiz com o perfil',
              ]} />
            </section>

            <Divider />

            {/* 4. VÍDEO */}
            <section id="video-verificacao" className="scroll-mt-24">
              <SectionTitle eyebrow="04" title="Vídeo de verificação 360°" icon={<FileVideo className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-6">
                Pedido depois de adicionares a primeira foto. Serás redirecionada para{' '}
                <strong className="text-foreground font-medium">onesugar.pt/companions/verification</strong>.
              </p>

              <p className="text-sm font-semibold text-foreground mb-4">O que gravar</p>
              <Steps steps={[
                { title: 'Prepara um papel', desc: <span>Escreve à mão <strong className="text-foreground font-medium">"OneSugar"</strong> e a <strong className="text-foreground font-medium">data de hoje</strong> de forma legível.</span> },
                { title: 'Grava o vídeo', desc: 'Segura o papel e grava mostrando claramente o rosto e o corpo completo, com boa iluminação. O vídeo deve ter entre 10 e 15 segundos.' },
                { title: 'Envia na plataforma', desc: 'Faz o upload. Tamanho máximo: 50 MB. Qualquer formato de vídeo é aceite (MP4, MOV, etc.).' },
              ]} />

              <div className="mt-5 space-y-3">
                <Callout>
                  <strong>Vídeo maior que 50 MB?</strong> Comprima-o antes de enviar:{' '}
                  iPhone: <strong>Video Compress</strong> · Android: <strong>Video Compressor</strong> · Online: <strong>clideo.com</strong>
                </Callout>

                <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  <strong className="text-foreground">Para que serve:</strong> o vídeo é comparado com as fotos do perfil para confirmar que és a mesma pessoa e que és maior de idade. Serve também para prevenir perfis falsos e fraude na plataforma.
                </div>
              </div>
            </section>

            <Divider />

            {/* 5. VERIFICAÇÃO */}
            <section id="verificacao" className="scroll-mt-24">
              <SectionTitle eyebrow="05" title="Como funciona a verificação de perfil" icon={<ShieldCheck className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-5">A verificação tem dois passos obrigatórios, feitos por ordem:</p>

              <Steps steps={[
                { title: 'Vídeo de verificação 360°', desc: 'Descrito na secção anterior.' },
                {
                  title: 'Documento de identificação',
                  desc: (
                    <span>
                      Passaporte, Cartão de Cidadão / RG ou Carta de Condução / CNH.
                      Formatos: JPG, PNG ou PDF · Tamanho máximo: <strong className="text-foreground font-medium">5 MB</strong>.
                    </span>
                  ),
                },
              ]} />

              <p className="text-sm text-muted-foreground mt-4 mb-5">
                Depois de enviares ambos, o teu perfil fica <strong className="text-foreground font-medium">"Pendente de aprovação"</strong> enquanto a equipa faz a revisão manual.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">O que a equipa verifica</p>
                  <CheckList ok={true} items={[
                    'Correspondência facial (selfie com documento)',
                    'Data visível e legível no papel',
                    'Legibilidade do documento de identificação',
                    'Maioridade (tens de ter 18 anos ou mais)',
                    'Que és uma pessoa real',
                  ]} />
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 flex items-center gap-3 h-fit">
                  <Clock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo médio de resposta</p>
                    <p className="text-lg font-bold text-foreground">Poucos minutos</p>
                    <p className="text-xs text-muted-foreground">em horário de suporte</p>
                  </div>
                </div>
              </div>
            </section>

            <Divider />

            {/* 6. APROVAÇÃO */}
            <section id="aprovacao" className="scroll-mt-24">
              <SectionTitle eyebrow="06" title="Como funciona a aprovação do perfil" icon={<ThumbsUp className="h-4 w-4" />} />

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-foreground">Perfil aprovado</p>
                  </div>
                  <p className="text-sm text-muted-foreground">O teu perfil fica visível na plataforma e aparece nas listagens. Receberás uma notificação por e-mail.</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <p className="text-sm font-semibold text-foreground">Perfil rejeitado</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Receberás um e-mail com os motivos. Podes corrigir os pontos indicados e reativar o perfil — ele não é eliminado.</p>
                </div>
              </div>

              <p className="text-sm font-semibold text-foreground mb-3">Motivos comuns de rejeição</p>
              <CheckList ok={false} items={[
                'Informação incompleta — nome, localização, idiomas ou descrição em falta',
                'Fotos de má qualidade, pouco nítidas ou sem identificação clara',
                'Fotos com marcas de água, texto sobreposto ou contactos visíveis',
                'Informação pessoal incorreta ou impossível de confirmar',
                'Conteúdo explícito ou que não respeita as regras da comunidade',
                'Apresentação do perfil pouco cuidada ou sem informação suficiente',
              ]} />
            </section>

            <Divider />

            {/* 7. DICAS */}
            <section id="dicas" className="scroll-mt-24">
              <SectionTitle eyebrow="07" title="Dicas para um anúncio de maior qualidade" icon={<Lightbulb className="h-4 w-4" />} />
              <div className="space-y-3">
                {[
                  { title: 'Perfil completo = mais visibilidade', desc: 'Perfis com todas as características preenchidas aparecem com mais destaque nos resultados e filtros.' },
                  { title: 'Fotos que convertem', desc: 'Fundo limpo e neutro, boa iluminação (de preferência luz natural), expressão natural, variedade de poses.' },
                  { title: 'Descrição curta eficaz', desc: 'Usa os 60 caracteres para comunicar o que te diferencia — é o primeiro texto que os clientes leem na listagem.' },
                  { title: 'Descrição completa honesta', desc: 'Texto claro e profissional sobre ti, o que gostas e o que ofereces (mín. 30, máx. 350 caracteres).' },
                  { title: 'Preço', desc: 'O intervalo típico na plataforma é entre 150€ e 1 500€ por hora — ajusta consoante o teu posicionamento.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Divider />

            {/* 8. FAQ */}
            <section id="faq" className="scroll-mt-24">
              <SectionTitle eyebrow="08" title="Perguntas frequentes" icon={<HelpCircle className="h-4 w-4" />} />
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {[
                  { q: 'Quanto tempo demora até o meu perfil aparecer?', a: 'De alguns minutos a algumas horas, dependendo do volume de pedidos. Em horário de suporte (08h00–18h00) o tempo é tipicamente mais curto.' },
                  { q: 'O meu vídeo de verificação foi rejeitado. O que faço?', a: 'Regrava o vídeo seguindo as instruções enviadas por e-mail ou WhatsApp. Certifica-te de que a data está legível, que seguras o papel com "OneSugar" e que o rosto e o corpo estão claramente visíveis.' },
                  { q: 'Posso editar o meu anúncio depois de publicado?', a: 'Sim. Podes editar toda e qualquer informação — texto, fotos, vídeos e preço — a qualquer momento, sem precisares de criar um novo perfil.' },
                  { q: 'Quantas fotos posso ter no perfil?', a: 'No plano gratuito podes ter até 10 fotos e vídeos. Nos planos pagos (Classic, Plus, VIP) o limite sobe para 30 fotos e vídeos.' },
                  { q: 'O meu documento não está a ser aceite. O que faço?', a: 'Documentos aceites: Passaporte, Cartão de Cidadão / RG, Carta de Condução / CNH. O ficheiro deve estar em formato JPG, PNG ou PDF e ter no máximo 5 MB. Deve estar legível, sem reflexos ou partes cortadas.' },
                  { q: 'O registo é gratuito?', a: 'Sim, criar um perfil na Onesugar é completamente gratuito. Para teres mais visibilidade e fechar mais clientes, existem planos pagos.', cta: true },
                  { q: 'A Onesugar partilha os meus dados com terceiros?', a: 'Não. Os dados enviados (vídeo e documento) são utilizados exclusivamente para verificação de identidade e não são partilhados com terceiros. Consulta a nossa Política de Privacidade para mais detalhes.' },
                  { q: 'Posso ter mais do que um perfil com o mesmo e-mail?', a: 'Não. Cada conta está vinculada a um e-mail — 1 e-mail = 1 conta. Criar múltiplas contas pode resultar em suspensão permanente.' },
                ].map((item, i) => (
                  <details key={i} className="group">
                    <summary className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer select-none text-sm font-medium text-foreground hover:bg-muted/30 transition-colors list-none">
                      {item.q}
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                      {item.cta && (
                        <Link href="/checkout" className="ml-1 text-primary hover:underline font-medium">
                          Ver planos →
                        </Link>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <Divider />

            {/* 9. SUPORTE */}
            <section id="suporte" className="scroll-mt-24">
              <SectionTitle eyebrow="09" title="Precisa de mais ajuda?" icon={<Headphones className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-5">A nossa equipa está disponível para te apoiar.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/351913895353"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors p-5 group"
                >
                  <IconBrandWhatsapp className="h-8 w-8 text-[#25D366] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">WhatsApp</p>
                    <p className="text-base font-bold text-foreground group-hover:text-[#25D366] transition-colors">+351 913 895 353</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
                  <Clock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Horário de atendimento</p>
                    <p className="text-base font-bold text-foreground">08h00 — 18h00</p>
                  </div>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </>
  );
}
