import type { Locale } from '@/lib/i18n';

/**
 * Textos da página /anunciar, nas duas línguas.
 *
 * Tudo o que aqui se diz sobre o registo corresponde ao que o site faz hoje
 * (formulário em 5 passos, verificação que pode ficar para depois, pausar e
 * apagar no painel, limites de fotos). Se o fluxo mudar, mudar aqui também.
 * Os valores dos planos ficam de fora de propósito: só aparecem depois de
 * criar a conta.
 */
export type TextosAnunciar = {
  meta: { title: string; description: string };
  migalha: { inicio: string; pagina: string };
  hero: { eyebrow: string; h1: string; lead: string; chips: string[]; verComo: string };
  form: {
    titulo: string;
    sub: string;
    telefone: string;
    telefoneAjuda: string;
    marketing: string;
    aceito: string;
    termos: string;
    e: string;
    privacidade: string;
    botao: string;
    jaTem: string;
    entrar: string;
    semCartao: string;
    erroTelefone: string;
    erroAceitar: string;
  };
  passos: {
    h2: string;
    sub: string;
    rotulos: string[];
    itens: { titulo: string; texto: string }[];
    tagVerificacao: string;
    depois: { titulo: string; texto: string };
  };
  /** O que ter à mão: uma linha de etiquetas logo abaixo do passo a passo. */
  precisa: { titulo: string; itens: string[] };
  verificacao: {
    h2: string;
    sub: string;
    blocos: { titulo: string; texto: string }[];
    depoisTitulo: string;
    depoisTexto: string;
  };
  porque: { h2: string; sub: string; itens: { titulo: string; texto: string }[] };
  planos: {
    h2: string;
    sub: string;
    gratis: { nome: string; preco: string; precoNota: string; itens: string[] };
    destaque: { nome: string; sub: string; itens: string[] };
    nota: string;
  };
  seo: {
    h2: string;
    paragrafos: string[];
    final: { antes: string; calculadora: string; meio: string; guia: string; depois: string };
  };
  faq: { h2: string; sub: string; itens: { q: string; a: string }[] };
  final: { h2: string; texto: string; botao: string };
  links: { titulo: string; texto: string; href: string; externo?: boolean }[];
  fixo: { botao: string; whatsapp: string };
};

const WHATSAPP_APOIO = 'https://wa.me/351913895353';

const pt: TextosAnunciar = {
  meta: {
    title: 'Anunciar como Acompanhante em Portugal, Grátis',
    description:
      'Anuncie como acompanhante na OneSugar: perfil grátis, sem comissões e contacto direto dos clientes. Veja o registo passo a passo e como funciona a verificação.',
  },
  migalha: { inicio: 'Início', pagina: 'Anunciar' },
  hero: {
    eyebrow: 'Para mulheres, homens e trans',
    h1: 'Anuncie como acompanhante em Portugal',
    lead:
      'Crie o seu anúncio grátis, receba contactos diretos dos clientes e fique com 100% do que ganha. Sem agência e sem comissões.',
    chips: ['Grátis para criar', 'Só maiores de 18', 'Dados protegidos'],
    verComo: 'Ver como funciona o registo',
  },
  form: {
    titulo: 'Comece o seu anúncio',
    sub: 'Deixe o número que os clientes vão usar. A seguir cria a conta e continua o registo.',
    telefone: 'Telemóvel profissional',
    telefoneAjuda: 'Aparece no seu perfil. Pode mudar depois.',
    marketing: 'Aceito receber informações sobre o meu registo e promoções.',
    aceito: 'Tenho 18 anos ou mais e concordo com os',
    termos: 'Termos de uso',
    e: 'e a',
    privacidade: 'Política de Privacidade',
    botao: 'Criar o meu anúncio grátis',
    jaTem: 'Já tem conta?',
    entrar: 'Entrar',
    semCartao: 'Grátis e sem cartão.',
    erroTelefone: 'Introduza um número de telemóvel válido.',
    erroAceitar: 'Para continuar, confirme que tem 18 anos ou mais e aceite os Termos e a Política de Privacidade.',
  },
  passos: {
    h2: 'Como funciona o registo, passo a passo',
    sub: 'Depois de criar a conta, são 5 passos. Se sair a meio, o que já escreveu fica guardado neste aparelho.',
    rotulos: ['Conta', 'Passo 1', 'Passo 2', 'Passo 3', 'Passo 4', 'Passo 5'],
    itens: [
      { titulo: 'Crie a conta', texto: 'Com e-mail e palavra-passe. Leva menos de um minuto.' },
      { titulo: 'Informações', texto: 'Nome, idade, telemóvel, preço por hora e uma descrição.' },
      { titulo: 'Localização', texto: 'O distrito e a zona onde atende, e se recebe em local próprio ou em hotel.' },
      { titulo: 'Fotos', texto: 'Pelo menos uma. A primeira é a capa do seu anúncio.' },
      { titulo: 'Verificação', texto: 'Um vídeo curto e um documento, que só a equipa vê. Pode deixar para depois.' },
      { titulo: 'Sobre si', texto: 'Línguas, características e redes sociais. Tudo opcional.' },
    ],
    tagVerificacao: 'Segurança',
    depois: {
      titulo: 'Aprovação e perfil online',
      texto:
        'A equipa revê o perfil, normalmente em minutos ou poucas horas, e avisa por e-mail. A partir daí, o anúncio aparece no seu distrito e os clientes falam consigo diretamente.',
    },
  },
  precisa: {
    titulo: 'Tenha à mão:',
    itens: ['Número de telemóvel', 'Fotos nítidas', 'Descrição e preço', 'Documento e vídeo curto'],
  },
  verificacao: {
    h2: 'Documento e vídeo: uma barreira de segurança, não um obstáculo',
    sub: 'Protege quem anuncia e quem procura. Não é uma avaliação: só confirma que o perfil é mesmo seu.',
    blocos: [
      {
        titulo: 'O que se pede',
        texto:
          'Um vídeo de 10 a 15 segundos a segurar um papel com "OneSugar" e a data do dia, e uma foto do documento de identificação.',
      },
      {
        titulo: 'Para que serve',
        texto:
          'Confirmar que é uma pessoa real, maior de 18 anos, e que as fotos são suas. Impede perfis falsos e cópias das suas fotos.',
      },
      {
        titulo: 'Quem vê',
        texto:
          'Só a equipa de verificação. Nunca aparecem no perfil, não são partilhados e são apagados com a conta.',
      },
    ],
    depoisTitulo: 'Prefere fazer mais tarde?',
    depoisTexto:
      'Escolha "Pular por agora" e verifique quando quiser. O perfil pode ir para o ar sem o selo de verificado; só os planos de destaque pedem a verificação feita.',
  },
  porque: {
    h2: 'Porquê anunciar na OneSugar',
    sub: 'Uma plataforma de anúncios feita para quem quer anunciar com segurança e sem intermediários.',
    itens: [
      { titulo: 'Sem agência nem comissões', texto: 'Não marcamos encontros nem ficamos com nada do que ganha.' },
      { titulo: 'Clientes que já procuram', texto: 'O anúncio aparece no seu distrito, onde os clientes chegam pelo Google.' },
      { titulo: 'Você no controlo', texto: 'Edite, pause ou apague o anúncio quando quiser.' },
      { titulo: 'Mulheres, homens e trans', texto: 'Cada perfil aparece no filtro certo para quem procura.' },
    ],
  },
  planos: {
    h2: 'Comece grátis. Destaque-se quando quiser.',
    sub: 'O perfil gratuito já é publicado no seu distrito. Os planos de destaque são opcionais e pode cancelar quando quiser.',
    gratis: {
      nome: 'Perfil gratuito',
      preco: '0 €',
      precoNota: 'sem prazo',
      itens: ['Publicado no seu distrito', 'Até 10 fotos e vídeos', 'Contacto direto dos clientes', 'Selo de verificado'],
    },
    destaque: {
      nome: 'Planos Clássico, Plus e VIP',
      sub: 'Para aparecer antes dos outros perfis do distrito',
      itens: [
        'Destaque no distrito e no carrossel',
        'Até 30 fotos e vídeos',
        'Áudio de apresentação',
        'Selo do plano no perfil',
        'Plus e VIP: lista de clientes bloqueados e apoio prioritário',
      ],
    },
    nota: 'Os valores e a escolha do plano estão na sua área de anunciante, depois de criar a conta e verificar o perfil.',
  },
  seo: {
    h2: 'Onde anunciar como acompanhante em Portugal',
    paragrafos: [
      'Na hora de escolher onde anunciar, vale olhar para quatro coisas: se a plataforma verifica os perfis, se fica com parte do que ganha, se o contacto com os clientes é direto e o que acontece com os seus dados.',
      'Na OneSugar, todos os perfis passam por uma revisão da equipa antes de irem para o ar, e a verificação de identidade dá o selo de perfil verificado. Não há comissões nem intermediários: o cliente encontra o anúncio na página do distrito e fala consigo pelo número do perfil. O documento e o vídeo ficam só com a equipa e saem do sistema quando apaga a conta.',
    ],
    final: {
      antes: 'Quer saber quanto pode ganhar antes de começar? Use a ',
      calculadora: 'calculadora de ganhos',
      meio: '. Para dicas sobre fotos, descrição e aprovação, veja o ',
      guia: 'guia para anunciantes',
      depois: '.',
    },
  },
  faq: {
    h2: 'Perguntas frequentes',
    sub: 'O que mais nos perguntam antes de criar o anúncio.',
    itens: [
      {
        q: 'Quanto custa anunciar na OneSugar?',
        a: 'Criar e publicar o perfil é grátis e não pede cartão. Os planos de destaque (Clássico, Plus e VIP) são opcionais: os valores aparecem na sua área de anunciante depois de criar a conta.',
      },
      {
        q: 'A OneSugar é uma agência?',
        a: 'Não. A OneSugar é uma plataforma de anúncios: não marca encontros nem fica com nenhuma percentagem. Os clientes falam consigo diretamente, pelo número do seu perfil.',
      },
      {
        q: 'Porque é que pedem documento e vídeo?',
        a: 'É uma barreira de segurança. Serve para confirmar que é uma pessoa real, maior de 18 anos, e que as fotos são suas. Impede que perfis falsos usem as suas fotos e dá ao anúncio o selo de perfil verificado.',
      },
      {
        q: 'Quem vê o meu documento e o vídeo de verificação?',
        a: 'Só a equipa de verificação. Não aparecem no perfil, não são partilhados com ninguém e são apagados se apagar a conta.',
      },
      {
        q: 'Posso deixar a verificação para depois?',
        a: 'Sim. No passo da verificação pode escolher "Pular por agora". O perfil pode ir para o ar sem o selo de verificado e faz a verificação quando quiser, a partir do seu painel. Só a escolha de um plano de destaque pede a verificação feita.',
      },
      {
        q: 'Quanto tempo demora a aprovação do perfil?',
        a: 'Normalmente de alguns minutos a algumas horas. Em horário de apoio (8h às 18h) é mais rápido. Recebe um e-mail quando o perfil for aprovado.',
      },
      {
        q: 'Homens e pessoas trans podem anunciar?',
        a: 'Sim. No registo escolhe o género (feminino, masculino ou trans) e o perfil aparece no filtro correspondente da página do seu distrito.',
      },
      {
        q: 'Preciso de fotografias profissionais?',
        a: 'Não. Bastam fotos nítidas, com boa luz e sem marcas de água, texto ou contactos por cima. Pode ter até 10 fotos e vídeos no perfil gratuito e até 30 nos planos de destaque.',
      },
      {
        q: 'Posso pausar ou apagar o anúncio?',
        a: 'Sim, no seu painel. Ao pausar, o perfil deixa de aparecer no site até o reativar. Ao apagar a conta, o perfil, as fotos, o vídeo e o documento são removidos de vez.',
      },
    ],
  },
  final: {
    h2: 'Comece hoje o seu anúncio',
    texto: 'É grátis, sem cartão e sem comissões. Leva poucos minutos.',
    botao: 'Criar o meu anúncio grátis',
  },
  links: [
    { titulo: 'Guia para anunciantes', texto: 'O passo a passo completo, das fotos à aprovação.', href: '/ajuda-anunciantes' },
    { titulo: 'Calculadora de ganhos', texto: 'Quanto pode ganhar, conforme o preço e os dias.', href: '/quanto-ganha-acompanhante' },
    { titulo: 'Apoio por WhatsApp', texto: 'Das 8h às 18h, para qualquer dúvida.', href: WHATSAPP_APOIO, externo: true },
  ],
  fixo: { botao: 'Criar anúncio grátis', whatsapp: 'Falar com o apoio por WhatsApp' },
};

const en: TextosAnunciar = {
  meta: {
    title: 'Advertise as an Escort in Portugal for Free',
    description:
      'Advertise as a companion on OneSugar: free profile, no commission and direct contact with clients. See how sign up and verification work, step by step.',
  },
  migalha: { inicio: 'Home', pagina: 'Advertise' },
  hero: {
    eyebrow: 'For women, men and trans',
    h1: 'Advertise as a companion in Portugal',
    lead:
      'Create your listing for free, get direct contact from clients and keep 100% of what you earn. No agency and no commission.',
    chips: ['Free to create', '18+ only', 'Your data protected'],
    verComo: 'See how sign up works',
  },
  form: {
    titulo: 'Start your listing',
    sub: 'Enter the number clients will use. Next, you create your account and carry on with sign up.',
    telefone: 'Work phone number',
    telefoneAjuda: 'Shown on your profile. You can change it later.',
    marketing: 'I agree to receive updates about my sign up and promotions.',
    aceito: 'I am 18 or older and I agree to the',
    termos: 'Terms of Use',
    e: 'and the',
    privacidade: 'Privacy Policy',
    botao: 'Create my free listing',
    jaTem: 'Already have an account?',
    entrar: 'Log in',
    semCartao: 'Free, no card needed.',
    erroTelefone: 'Please enter a valid phone number.',
    erroAceitar: 'To continue, confirm you are 18 or older and accept the Terms and the Privacy Policy.',
  },
  passos: {
    h2: 'How sign up works, step by step',
    sub: 'Once your account is created, there are 5 steps. If you stop halfway, what you wrote is saved on this device.',
    rotulos: ['Account', 'Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
    itens: [
      { titulo: 'Create your account', texto: 'With your email and a password. It takes less than a minute.' },
      { titulo: 'Details', texto: 'Name, age, phone number, hourly rate and a description.' },
      { titulo: 'Location', texto: 'Your district and area, and whether you host or meet at hotels.' },
      { titulo: 'Photos', texto: 'At least one. The first one is the cover of your listing.' },
      { titulo: 'Verification', texto: 'A short video and an ID document, seen only by our team. You can do it later.' },
      { titulo: 'About you', texto: 'Languages, features and social media. All optional.' },
    ],
    tagVerificacao: 'Safety',
    depois: {
      titulo: 'Approval and going live',
      texto:
        'Our team reviews your profile, usually within minutes or a few hours, and lets you know by email. From then on your listing shows in your district and clients contact you directly.',
    },
  },
  precisa: {
    titulo: 'Have ready:',
    itens: ['Phone number', 'Clear photos', 'Description and rate', 'ID and a short video'],
  },
  verificacao: {
    h2: 'ID and video: a safety check, not an obstacle',
    sub: 'It protects advertisers and clients alike. It is not an assessment: it only confirms the profile is really yours.',
    blocos: [
      {
        titulo: 'What we ask for',
        texto:
          'A 10 to 15 second video holding a note with "OneSugar" and today\'s date, and a photo of your ID document.',
      },
      {
        titulo: 'Why',
        texto:
          'To confirm you are a real person, over 18, and that the photos are yours. It stops fake profiles and copies of your photos.',
      },
      {
        titulo: 'Who sees it',
        texto:
          'Only our verification team. Never shown on your profile, never shared and deleted with your account.',
      },
    ],
    depoisTitulo: 'Rather do it later?',
    depoisTexto:
      'Choose "Skip for now" and verify whenever you like. Your profile can go live without the verified badge; only featured plans require verification.',
  },
  porque: {
    h2: 'Why advertise on OneSugar',
    sub: 'A listings platform for people who want to advertise safely, without middlemen.',
    itens: [
      { titulo: 'No agency, no commission', texto: 'We do not arrange bookings or take any of what you earn.' },
      { titulo: 'Clients already searching', texto: 'Your listing shows in your district, where clients arrive from Google.' },
      { titulo: 'You are in control', texto: 'Edit, pause or delete your listing whenever you like.' },
      { titulo: 'Women, men and trans', texto: 'Every profile shows under the right filter for clients.' },
    ],
  },
  planos: {
    h2: 'Start for free. Stand out when you want.',
    sub: 'Your free profile is already published in your district. Featured plans are optional and you can cancel at any time.',
    gratis: {
      nome: 'Free profile',
      preco: '€0',
      precoNota: 'no time limit',
      itens: ['Published in your district', 'Up to 10 photos and videos', 'Direct contact from clients', 'Verified badge'],
    },
    destaque: {
      nome: 'Classic, Plus and VIP plans',
      sub: 'To show before other profiles in your district',
      itens: [
        'Featured in your district and carousel',
        'Up to 30 photos and videos',
        'Voice introduction',
        'Plan badge on your profile',
        'Plus and VIP: blocked clients list and priority support',
      ],
    },
    nota: 'Prices and plan choice are in your advertiser area, once you have created your account and verified your profile.',
  },
  seo: {
    h2: 'Where to advertise as a companion in Portugal',
    paragrafos: [
      'When choosing where to advertise, look at four things: whether the platform verifies profiles, whether it takes a cut of what you earn, whether clients contact you directly and what happens to your data.',
      'On OneSugar, every profile is reviewed by our team before it goes live, and identity verification gives it the verified badge. There is no commission and no middleman: clients find your listing on your district page and contact you on your profile number. Your ID and video stay with our team only and are removed when you delete your account.',
    ],
    final: {
      antes: 'Want to know how much you could earn first? Try the ',
      calculadora: 'earnings calculator',
      meio: '. For tips on photos, description and approval, see the ',
      guia: 'advertiser guide',
      depois: '.',
    },
  },
  faq: {
    h2: 'Frequently asked questions',
    sub: 'What people ask us most before creating a listing.',
    itens: [
      {
        q: 'How much does it cost to advertise on OneSugar?',
        a: 'Creating and publishing your profile is free and needs no card. Featured plans (Classic, Plus and VIP) are optional: prices show in your advertiser area once you have an account.',
      },
      {
        q: 'Is OneSugar an agency?',
        a: 'No. OneSugar is a listings platform: we do not arrange bookings or take any percentage. Clients contact you directly on your profile number.',
      },
      {
        q: 'Why do you ask for ID and a video?',
        a: 'It is a safety check. It confirms you are a real person, over 18, and that the photos are yours. It protects you from fake profiles using your photos and gives your listing the verified badge.',
      },
      {
        q: 'Who sees my ID and verification video?',
        a: 'Only our verification team. They never appear on your profile, are never shared and are deleted if you delete your account.',
      },
      {
        q: 'Can I verify later?',
        a: 'Yes. At the verification step you can choose "Skip for now". Your profile can go live with the "Not verified" badge and you can verify later from your dashboard. Only choosing a featured plan requires verification.',
      },
      {
        q: 'How long does profile approval take?',
        a: 'Usually from a few minutes to a few hours, and faster during support hours (8am to 6pm). You get an email once your profile is approved.',
      },
      {
        q: 'Can men and trans people advertise?',
        a: 'Yes. At sign up you choose your gender (female, male or trans) and your profile shows under the matching filter on your district page.',
      },
      {
        q: 'Do I need professional photos?',
        a: 'No. Clear, well lit photos without watermarks, text or contact details on top are enough. You can have up to 10 photos and videos on the free profile and up to 30 on featured plans.',
      },
      {
        q: 'Can I pause or delete my listing?',
        a: 'Yes, from your dashboard. Pausing hides your profile until you reactivate it. Deleting your account permanently removes your profile, photos, video and ID.',
      },
    ],
  },
  final: {
    h2: 'Start your listing today',
    texto: 'Free, no card and no commission. It only takes a few minutes.',
    botao: 'Create my free listing',
  },
  links: [
    { titulo: 'Advertiser guide', texto: 'The full walkthrough, from photos to approval.', href: '/ajuda-anunciantes' },
    { titulo: 'Earnings calculator', texto: 'How much you could earn, by rate and days.', href: '/quanto-ganha-acompanhante' },
    { titulo: 'WhatsApp support', texto: '8am to 6pm, for any question.', href: WHATSAPP_APOIO, externo: true },
  ],
  fixo: { botao: 'Create free listing', whatsapp: 'Talk to support on WhatsApp' },
};

export const TEXTOS: Record<Locale, TextosAnunciar> = { pt, en };
export { WHATSAPP_APOIO };
