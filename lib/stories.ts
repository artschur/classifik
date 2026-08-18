export interface StoryImage {
  afterIndex: number; // after which paragraph index to render this image
  src: string;
  alt?: string;
}

export interface Story {
  slug: string;
  title: string;
  collection: string;
  collectionSlug: string;
  coverImage: string;
  excerpt: string;
  author: string;
  readTime: number;
  publishedAt: string; // ISO date string
  featured?: boolean;
  paragraphs: string[];
  inlineImages: StoryImage[];
}

export function isNew(publishedAt: string, days = 7): boolean {
  return Date.now() - new Date(publishedAt).getTime() < days * 86_400_000;
}

export function dbToStory(db: {
  slug: string;
  title: string;
  collection: string;
  collection_slug: string;
  cover_image_url: string | null;
  excerpt: string;
  author: string;
  read_time: number;
  published_at: Date;
  featured: boolean;
  paragraphs: unknown;
  inline_images: unknown;
}): Story {
  return {
    slug: db.slug,
    title: db.title,
    collection: db.collection,
    collectionSlug: db.collection_slug,
    coverImage: db.cover_image_url ?? '',
    excerpt: db.excerpt,
    author: db.author,
    readTime: db.read_time,
    publishedAt: db.published_at.toISOString(),
    featured: db.featured,
    paragraphs: (db.paragraphs as string[]) ?? [],
    inlineImages: ((db.inline_images as StoryImage[]) ?? []).map((img) => ({
      afterIndex: img.afterIndex,
      src: img.src,
      alt: img.alt,
    })),
  };
}

export interface Collection {
  slug: string;
  label: string;
  description: string;
}

export const collections: Collection[] = [
  {
    slug: 'historias-anonimas',
    label: 'Histórias Anónimas',
    description: 'Relatos reais enviados por leitores anónimos.',
  },
  {
    slug: 'memorias-acompanhante',
    label: 'Memórias duma Acompanhante',
    description: 'Contos longos narrados na primeira pessoa por Sandra Pink.',
  },
];

export const stories: Story[] = [
  {
    slug: 'licoes-de-vida',
    title: 'Lições de vida',
    collection: 'Histórias Anónimas',
    collectionSlug: 'historias-anonimas',
    coverImage: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%206.jpg',
    excerpt:
      'Uma amiga disse-me que havia um site que aceitava histórias reais. Há uns anos que acho que a minha história era digna de ser contada, por isso aqui vai…',
    author: 'M.A.',
    readTime: 5,
    publishedAt: '2025-07-04',
    featured: true,
    paragraphs: [
      'Uma amiga disse-me que havia um site que aceitava histórias reais. Há uns anos que acho que a minha história era digna de ser contada, por isso aqui vai…',
      'Ela era uma mulher magra, de pele clara e ia muitas vezes à missa. Sei disso porque à época eu trabalhava num café e via-a passar todos os dias e entrar na igreja do outro lado da rua. Tinha 30 ou 40 anos, era difícil dizer, pois vestia-se como se tivesse vindo dos anos 80, com roupa que parecia da avó, muito larga e sóbria.',
      'Nunca tinha entrado, até àquele dia. Sentou-se ao balcão, pediu um café e assim que lho servi desatou a chorar. Tentei consolá-la, mas ela não parava. Então dei a volta e abracei-a, o que mais poderia fazer? Acabou por me confidenciar o que a perturbava. Tinha conhecido um homem na igreja, dizia que queria casar com ela, que estava muito apaixonado e não queria esperar, queria que fizessem amor. Ela tinha medo, pois não sabia nada sobre o assunto e temia que ele perdesse o interesse quando percebesse que ela era uma inútil na cama…',
      'Perguntei-lhe se era virgem, ela disse que "não propriamente". Tinha tido um namorado com quem perdeu a virgindade, mas tinha sido só dessa vez e não tinha sido uma boa experiência. Sequei-lhe as lágrimas, acabei por beijá-la, e uma coisa levou à outra…',
      '— Se quiseres eu ensino-te…',
      'Tranquei a porta, baixei as persianas do café e levei-a para um dos sofás, onde comecei a beijá-la e tocá-la com ardor.',
      '— Costumas masturbar-te? — perguntei, enquanto lhe metia as mãos por baixo da saia e lhe acariciava a vagina por cima das cuecas. Percebi logo aí que era abundantemente peluda.',
      'Depois de alguma insistência, admitiu que sim.',
      '— Muitas vezes? Tapou a cara, muito vermelha. — Sim… — E confessas ao padre? — perguntei, só por piada. — Não! Tenho muita vergonha… — Não tenhas, é completamente natural. És uma mulher adulta, não é nenhum pecado querer sentir prazer.',
      'Abri-lhe a camisa e puxei-lhe o soutien para baixo, revelando provavelmente as maminhas mais perfeitas que já vi na minha vida! Não eram muito grandes, mas eram redondinhas, com os bicos espetados, pareciam um desenho. Beijei-as e apalpei-as e ela estremeceu quando lhe acariciei os mamilos com a ponta da língua.',
      '— Mostra-me o que tens aí em baixo — disse, deitando-a no sofá.',
      'Eu estava atónito… Quem diria que aquela aparência austera escondia tantas delícias! Tirei-lhe os óculos e soltei-lhe os cabelos, que ela usava sempre apanhado, e depois disso ninguém diria que era a mesma mulher.',
      '— Mas tu és linda! — Achas mesmo? — O teu gajo vai ficar louco quando te vir assim! Aliás, acho que te vou pedir em casamento primeiro!',
      'Ela riu-se, mais descontraída, e aproveitei para tirar as calças. Já estava de pau feito, claro. Ela ficou a olhar para ele muito tempo, nitidamente excitada.',
      'Fez-me um broche tão natural que ninguém diria que era a primeira vez.',
      '— Chega, senão não aguento. Chupas muito bem, sabias? Anda, abre as perninhas.',
      'Penetrei-a lentamente no início, acelerando o ritmo e a intensidade à medida que os seus gemidos iam aumentando.',
      'Fodí-a à missionário no sofá durante longos minutos, sem parar de a beijar na boca e de lhe apalpar as mamas, o que a fazia gemer mais e revirar os olhos.',
      '— Vira-te um bocadinho, os homens também gostam assim…',
      'A escala dos seus gemidos foi crescendo até se tornarem pequenos gritinhos, tão sensuais que só me apetecia parti-la toda!',
      'Ela não se veio dessa vez, mas tivemos várias lições até ela finalmente se sentir preparada para se entregar ao seu pretendente. Não a ensinei só a foder, mas também a deixar-se ir e aceitar o prazer até atingir o orgasmo.',
      'No ano seguinte recebi um convite para o casamento, mas achei melhor não ir. As nossas lições foram tão inesquecíveis que acho que se a visse de novo só conseguiria pensar numa coisa… E não queria estragar-lhe a vida. Preferi ficar só com as memórias, que agora tenho o prazer de partilhar com todos vocês.',
      'Espero que gostem.',
    ],
    inlineImages: [
      { afterIndex: 0,  src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%207.jpg', alt: '' },
      { afterIndex: 10, src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%208.jpg', alt: '' },
      { afterIndex: 17, src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%209.jpg', alt: '' },
    ],
  },
  {
    slug: 'a-armadilha',
    title: 'A armadilha',
    collection: 'Histórias Anónimas',
    collectionSlug: 'historias-anonimas',
    coverImage: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%2010.jpg',
    excerpt:
      'Se calhar vão achar esta história inacreditável, mas juro-vos que é a mais pura das verdades. O normal é os homens serem obcecados com o sexo anal…',
    author: 'C.R.A.',
    readTime: 4,
    publishedAt: '2025-07-07',
    paragraphs: [
      'Se calhar vão achar esta história inacreditável, mas juro-vos que é a mais pura das verdades.',
      'O normal é os homens serem obcecados com o sexo anal, provavelmente porque muitas mulheres não gostam e não querem. Comigo é ao contrário. Desde que experimentei com o meu primeiro amante a sério, adorei e fiz praticamente com todos os namorados que tive a seguir. Que me lembre nunca tive uma rejeição, aliás, os homens ficavam doidos de tesão só por ser eu a sugerir.',
      'Até que no ano passado conheci o homem da minha vida, aquele que sabemos logo que é para casar, e não quis perder tempo e casámos mesmo ao fim de três meses. Ele era incrível, lindo, inteligente, apaixonado, tudo o que uma mulher sonha e raramente consegue encontrar num único exemplar.',
      'Quanto ao sexo, não podia dizer que fosse o melhor do mundo, mas pensei que teria muitos anos para o ensinar e pôr ao jeito.',
      'O problema é que, depois do casamento, em vez de melhorar, as coisas pioraram… Ele resistia às minhas ideias e ensinamentos, queria ritualizar, sexo à missionário e pouco mais, porque achava que era assim que faziam os casais, que era assim que era respeitável e decente, enfim, uma série de preconceitos de merda que, talvez por estar distraída pela paixão, eu não percebi nele até se revelarem.',
      'Mas o pior de tudo era: sexo anal, nem pensar!',
      'O quê?! Então aquilo que todos os homens querem e não têm, tu tens e não queres? Mas que espécie de idiota és tu?! Não lho disse de viva voz, mas esperava que ele percebesse pelo meu olhar…',
      'Ora só aquela nega me encheu o olho de comichões! Eu sabia que não poderia passar o resto da vida sem a minha iguaria preferida. Portanto, tinha duas alternativas: ou tomava um amante só para a enrabadela, ou tinha de arranjar maneira de convencer o meu marido. Decidi dar-lhe uma segunda oportunidade e fiz cá os meus planos.',
      'Para começar, três semanas sem sexo! Ele já andava louco, vinha ter comigo e eu dizia que não, não me apetecia, devia ser stress. Mas qual stress, gritava ele, se passas o dia a ver novelas?',
      'Se ele já andava assim, eu então andava a trepar pelas paredes! Nunca na minha vida estivera tantos dias sem um caralho devidamente entalado dentro de mim!',
      'Mas fazia tudo parte do plano e uma noite, já na cama, ele vem para cima de mim e eu sei que é o momento ideal para montar a minha armadilha. Primeiro, atiro com ele cama abaixo. Não, não me apetece, deve ser stress. E ele cada vez mais piurso! Até que lhe dou uma sugestão alternativa:',
      '— Só se for assim de ladinho, ou melhor ainda, por trás, porque estou muito cansada e não me apetece fazer nada. Assim fazes tu tudo como se eu não estivesse aqui.',
      'Ele estava desesperado e aceitava qualquer coisa. Vem e começa a apalpar-me toda, e eu já toda molhada, mas digo-lhe que é melhor apagar a luz, porque estou com um bocadinho de dor de cabeça.',
      'E zás, de luzes apagadas, sem ele saber onde ia, ajeitei-o para o centro do pacote e, mal sentiu uma aberta, ele empurrou com toda a força. Palavra que até senti lágrimas a saltarem-me dos olhos, e não era dor, era emoção, prazer, saudade!',
      'Cego de tesão, pregou-me a melhor enrabadela da minha vida e veio-se copiosamente no meu cu!',
      'No final perguntei-lhe se tinha gostado.',
      '— Foda-se, foi tão bom! — De zero a 20? — 21!',
      'Ri-me. — Se quiseres fazemos outra vez assim amanhã, queres? — Se quero?! Foi a melhor foda da minha vida!',
      '— Eu também adorei. Até vi estrelas! Não era mentira nenhuma.',
      '— Agora acende a luz e olha para a tua pila…',
      'Ele ficou um pouco espantado com o pedido, mas fez o que lhe disse. Como esperava, estava acastanhada como se tivesse estado a marinar num cappuccino…',
      '— Percebeste agora, minha besta?',
      'Mas ele nem precisou de responder, via-se tudo nos seus olhinhos felizes.',
      'A partir desse dia nunca mais se armou em esquisito quando lhe pedi para me ir ao cu…',
    ],
    inlineImages: [
      { afterIndex: 0,  src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%2011.jpg', alt: '' },
      { afterIndex: 12, src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%2012.jpg', alt: '' },
      { afterIndex: 19, src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%2013.jpg', alt: '' },
    ],
  },
  {
    slug: 'a-conta-que-ele-fez',
    title: 'A conta que ele fez',
    collection: 'Memórias duma Acompanhante',
    collectionSlug: 'memorias-acompanhante',
    coverImage: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%201.jpg',
    excerpt:
      'Já ouviram com certeza o ditado popular que nos diz que "dois é bom, mas três é demais". Mas decerto também conhecem a expressão "três é a conta que Deus fez"…',
    author: 'Sandra Pink',
    readTime: 10,
    publishedAt: '2025-07-10',
    paragraphs: [
      'Já ouviram com certeza o ditado popular que nos diz que "dois é bom, mas três é demais". Mas decerto também conhecem a expressão "três é a conta que Deus fez". Pois bem, algures no meio destes dois adágios matemáticos encontrarão a virtude do meu relato…',
      'Ele era um empresário português de grande sucesso, cujo nome não revelarei aqui por óbvias razões de privacidade. Já tínhamos estado juntos em duas circunstâncias, uma no Porto e outra em Braga, sempre no contexto das suas viagens de negócios. Desta feita ele escolheu o Algarve e era a primeira vez que nos encontrávamos para efeitos exclusivamente recreativos.',
      'Saímos de Lisboa numa sexta-feira de manhã, não sem antes matarmos saudades no hotel. Apesar dos seus quase 60 anos, ele mantinha uma excelente forma física e era um amante insaciável. Mais do que isso, tinha um dom inato para fazer amor… Logo no primeiro encontro, descobrira intuitivamente todos os meus "gatilhos".',
      'Era um daqueles amantes com quem podemos relaxar e abraçar o ato sem angústia, pois sabemos que, aconteça o que acontecer, vamos chegar onde desejamos. Com ele não havia erro, eram sempre um ou mais orgasmos, sem importar o tempo que eu precisasse.',
      'Passava pouco da hora de almoço quando chegámos ao nosso destino, uma velha villa próxima de Vilamoura, localizada no meio de um vinhedo que ele adquirira como retiro para se afastar de tudo. Ele disse que me queria fazer uma surpresa, o que me deixou animada, pois isso significava que desde o nosso último encontro ele tinha pensado em mim…',
      'Pelo seu lado, não sei se pela atmosfera mais descontraída, sem o stress dos negócios, ou se por já ser o nosso terceiro encontro, abriu-se mais do que das outras vezes. Sempre fora gentil e respeitoso, mas agora estava mais falador, mais liberto. E mais atrevido…',
      'Assim que chegámos e eu me fui esticar numa espreguiçadeira para apanhar um pouco de sol, ele disse: — O que é que estás a fazer com tanta roupa? Não está aqui mais ninguém…',
      'Ri-me e tirei o minúsculo bikini que mal cobria a minha nudez, um pouco admirada pela sua nova ousadia. Fora da cama, ele sempre havia sido um modelo de recato.',
      'E não se ficou por aí… Enquanto eu me deixava adormecer na modorra da brisa quente, ele voltou à carga: — Já que estás assim, toca-te um bocadinho para eu ver.',
      'A verdade é que os dois orgasmos da manhã tinham acendido, como sempre acontece, o meu lado sexual. Não sei como é com vocês, mas comigo é tiro e queda: quanto mais sexo faço, mais sexo me apetece. E aquele à-vontade dele… excitava-me!',
      'Fechei os olhos e comecei a masturbar-me, na expetativa que ele me dissesse para parar ou viesse ter comigo para passarmos a vias de fato, mas ele disse apenas: — Isso, continua. Continua assim…',
      'Não sei porquê, senti-me um pouco inibida com aquela exposição inusitada. Eu sei que estava nua, mas sentia-me despida, se entendem o que quero dizer…',
      'Mas, ao mesmo tempo, uma tesão crescente tomava conta de mim. E ali mesmo, à frente dele, acabei por me vir com bastante intensidade, sem conseguir calar um estridente coro de gemidos até ao grito final!',
      'Ele observou tudo, mas não se tocou, nem sequer baixou os calções.',
      'A praia não era longe e percorremos o caminho a pé, de mãos dadas como dois namorados. Abrimos a sombrinha, estendemos as toalhas e corremos para o mar. Depois deitámo-nos a apanhar banhos de sol.',
      'Ao longe viam-se algumas pessoas nuas, provavelmente estrangeiros. Embora a praia não fosse oficialmente de nudismo, era pequena e reservada e ninguém parecia importar-se.',
      '— Olha, porque é que não despes o bikini e me deixas ver esse corpinho de sereia? — Outra vez? Estás parvo? Aqui…? Há famílias, crianças… — E então? Estão a cuidar da vida delas, ninguém vai reparar.',
      '— O que é que estás assim? — Tu queres ver-me nua… ou queres que os outros me vejam nua?! — Qual é a diferença? — É uma grande diferença! — Ok, há uma diferença. Mas qual é o problema em partilhar…',
      '— O teu troféu? É isso, não é? É assim que me vês… Queres mostrar aos outros a gaja boa que fisgaste! — E se for? — questionou, a encolher os ombros. — Que mal há nisso?',
      'Senti-me desarmada. — Está bem, se é isso que queres… E despi, mais uma vez, o bikini, agora para toda a gente ver.',
      'Fomos até ao fim da praia e voltámos e eu não conseguia impedir-me de sentir o peso de mil olhares indiscretos em cima de mim, a investigar cada recanto do meu corpo nu.',
      'Até que, ao passarmos perto de um homem moreno, atraente, sentado na toalha, ele nos sorriu de uma maneira bastante libidinosa.',
      'Sem me perguntar nada, o meu amante fez sinal ao homem e este levantou-se e seguiu-nos. Ao fundo da praia havia uma pequena formação de árvores, uma espécie de mini-bosque, e foi aí que parámos.',
      '— Buongiorno — disse, com um enorme sorriso pepsodente.',
      'Foi então que o meu amante me beijou e disse: — Espero que gostes da tua surpresa.',
      'E finalmente percebi tudo… No nosso último encontro, enquanto confessávamos um ao outro os nossos respetivos fetiches, eu tinha-lhe dito que o meu maior sonho era estar com dois homens ao mesmo tempo. Mesmo com a minha profissão, nunca se tinha proporcionado. Era óbvio que ele tinha organizado tudo para eu poder realizar a minha fantasia…',
      'Quanto ao italiano, não sei onde o tinha desencantado, mas não podia ter escolhido parceiro mais aprazível, pois era de facto um belo exemplar de homem!',
      '— Não te preocupes, não sou ciumento. Sabes como gosto das coisas boas da vida. Gosto de ti. Quero que sejas feliz.',
      'Estava preparada para o receber dentro de mim, mas o meu amante cortou os seus avanços: — Não, foder não. Ainda não. Punheta…',
      'Deixei o italiano masturbar-se uns minutos até que não resisti mais, agachei-me à frente dele e meti o pau na minha boca, sugando com avidez todo o mel salgado e gelatinoso que ele ia libertando!',
      'Nessa altura, o meu amante, que até ai tinha sido um mero observador passivo, aproximou-se também, já com os calções em baixo e igualmente teso. Então chupei os dois à vez, até perceber pela respiração ofegante do italiano que ele estava próximo do êxtase.',
      '— Nas mamas — disse-lhe. E ele não se fez rogado: mal recebeu autorização, tirou-me o pau da boca e começou a disparar jactos de leite quente sobre o meu peito, deixando-me as mamas e a barriga a escorrer…',
      'Não havia muito mais a dizer, eu estava tão excitada que era capaz de comer os dois ali mesmo! Mas resisti ao meu impulso, agarrei neles e arrastei-os para casa. Precisava desesperadamente de sentir qualquer coisa dura dentro de mim!',
      'Mesmo com 10 anos de carreira no mundo escort, era a primeira vez que estava com dois homens ao mesmo tempo… E que revelação!',
      'Ao princípio eles dividiram-se pelos meus orifícios. Recebi o pénis do meu amante na boca, enquanto o italiano, já com as energias refeitas, aproveitou a minha posição inclinada para me penetrar por trás. Entre os dois, atingi rapidamente o orgasmo de que tanto necessitava!',
      'Depois, prosseguimos as festividades explorando todas as posições possíveis e imaginárias que a geometria de três corpos permite realizar…',
      'Nessa noite dormi no meio de ambos, e pela primeira vez na vida experimentei as delícias da dupla penetração, simultaneamente na vagina e no ânus. Uma daquelas experiências da qual não há retorno, pois depois daquilo uma mulher nunca mais é a mesma.',
      'Por vezes a vida põe-nos obstáculos e faz-nos questionar as nossas escolhas. Noutras, é como se o destino nos confirmasse por inteiro. Nesse momento de divino delírio, eu só era capaz de pensar: como amo o meu trabalho!',
      'Cada um terá a sua ideia, mas as minhas dúvidas ficaram desfeitas. Sim, dois é bom, mas nas circunstâncias certas, três não é definitivamente demais. É simplesmente a conta perfeita de um sonho tornado realidade…',
    ],
    inlineImages: [
      { afterIndex: 0,  src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%202.jpg', alt: '' },
      { afterIndex: 9,  src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%203.jpg', alt: '' },
      { afterIndex: 18, src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%204.jpg', alt: '' },
      { afterIndex: 30, src: 'https://vacjsnuttfzgcdaaqjxd.supabase.co/storage/v1/object/public/images/contos-temp/imagem%205.jpg', alt: '' },
    ],
  },
];

export function getStoryBySlug(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}

export function getStoriesByCollection(collectionSlug: string): Story[] {
  return stories.filter((s) => s.collectionSlug === collectionSlug);
}

export function getAllSlugs(): string[] {
  return stories.map((s) => s.slug);
}
