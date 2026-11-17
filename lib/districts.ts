/**
 * Nome de cada distrito como aparece ao público, com a preposição certa.
 *
 * A tabela de cidades da base de dados guarda alguns nomes sem acento
 * ("Setubal", "Evora"), e esses nomes iam direto para o título dos perfis.
 * Aqui fica a grafia usada nas páginas de distrito, indexada pelo slug, que
 * não muda. Um distrito que não esteja na lista cai no nome da base de dados
 * com "em", sem partir nada.
 */
/**
 * "Distrito" da listagem geral (/companions): a lista e os filtros dos
 * distritos, sem limitar a nenhum. Não há distrito com este slug.
 */
export const TODOS_OS_DISTRITOS = 'portugal';

const DISTRITOS: Record<string, { nome: string; prep: 'em' | 'no' | 'na' | 'nos' }> = {
  lisboa: { nome: 'Lisboa', prep: 'em' },
  porto: { nome: 'Porto', prep: 'no' },
  braga: { nome: 'Braga', prep: 'em' },
  aveiro: { nome: 'Aveiro', prep: 'em' },
  coimbra: { nome: 'Coimbra', prep: 'em' },
  leiria: { nome: 'Leiria', prep: 'em' },
  setubal: { nome: 'Setúbal', prep: 'em' },
  faro: { nome: 'Faro', prep: 'em' },
  evora: { nome: 'Évora', prep: 'em' },
  beja: { nome: 'Beja', prep: 'em' },
  portalegre: { nome: 'Portalegre', prep: 'em' },
  santarem: { nome: 'Santarém', prep: 'em' },
  'castelo-branco': { nome: 'Castelo Branco', prep: 'em' },
  guarda: { nome: 'Guarda', prep: 'na' },
  viseu: { nome: 'Viseu', prep: 'em' },
  'vila-real': { nome: 'Vila Real', prep: 'em' },
  braganca: { nome: 'Bragança', prep: 'em' },
  'viana-do-castelo': { nome: 'Viana do Castelo', prep: 'em' },
  madeira: { nome: 'Madeira', prep: 'na' },
  acores: { nome: 'Açores', prep: 'nos' },
};

/** O slug é de um dos distritos (ou regiões autónomas) com página no site? */
export function distritoConhecido(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(DISTRITOS, slug.toLowerCase());
}

export type Distrito = {
  slug: string;
  /** "Setúbal" */
  nome: string;
  /** "em Setúbal", "no Porto", "na Guarda" */
  emNome: string;
};

export function distritoPorSlug(slug: string, nomeNaBase?: string): Distrito {
  const conhecido = DISTRITOS[slug];
  const nome = conhecido?.nome ?? (nomeNaBase ?? slug).trim();
  const prep = conhecido?.prep ?? 'em';
  return { slug, nome, emNome: `${prep} ${nome}` };
}

/** Nomes em inglês que diferem do português. Os restantes ficam iguais. */
const NOMES_EN: Record<string, string> = {
  lisboa: 'Lisbon',
  acores: 'Azores',
};

function normalizar(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Nome do distrito para mostrar, a partir do slug ou do nome guardado na base
 * ("Setubal" vira "Setúbal"; em inglês "Lisboa" vira "Lisbon").
 */
export function nomeDistrito(slugOuNome: string, locale: 'pt' | 'en' = 'pt'): string {
  const chave = normalizar(slugOuNome);
  if (locale === 'en' && NOMES_EN[chave]) return NOMES_EN[chave];
  return DISTRITOS[chave]?.nome ?? slugOuNome.trim();
}

/** "in Lisbon", "in Porto": em inglês a preposição é sempre "in". */
export function inDistrict(slugOuNome: string): string {
  return `in ${nomeDistrito(slugOuNome, 'en')}`;
}

/**
 * Distritos que fazem fronteira (ou ficam mais perto, no caso da Madeira),
 * do mais procurado para o menos. Servem para mostrar perfis próximos quando
 * um distrito tem poucos ou nenhum.
 */
export const DISTRITOS_VIZINHOS: Record<string, string[]> = {
  'viana-do-castelo': ['braga', 'porto'],
  braga: ['porto', 'viana-do-castelo', 'vila-real'],
  porto: ['braga', 'aveiro', 'vila-real', 'viseu'],
  'vila-real': ['porto', 'braga', 'viseu', 'braganca'],
  braganca: ['vila-real', 'guarda'],
  aveiro: ['porto', 'coimbra', 'viseu'],
  viseu: ['porto', 'aveiro', 'coimbra', 'vila-real', 'guarda'],
  guarda: ['viseu', 'castelo-branco', 'coimbra', 'braganca'],
  coimbra: ['aveiro', 'leiria', 'viseu', 'castelo-branco', 'guarda'],
  leiria: ['lisboa', 'coimbra', 'santarem', 'castelo-branco'],
  'castelo-branco': ['coimbra', 'guarda', 'leiria', 'santarem', 'portalegre'],
  santarem: ['lisboa', 'leiria', 'setubal', 'evora', 'portalegre', 'castelo-branco'],
  lisboa: ['setubal', 'santarem', 'leiria'],
  setubal: ['lisboa', 'evora', 'beja', 'santarem'],
  portalegre: ['evora', 'santarem', 'castelo-branco'],
  evora: ['setubal', 'beja', 'portalegre', 'santarem'],
  beja: ['faro', 'evora', 'setubal'],
  faro: ['beja', 'setubal', 'lisboa'],
  madeira: ['lisboa', 'porto', 'faro'],
};
