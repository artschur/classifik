/**
 * Nome de cada distrito como aparece ao público, com a preposição certa.
 *
 * A tabela de cidades da base de dados guarda alguns nomes sem acento
 * ("Setubal", "Evora"), e esses nomes iam direto para o título dos perfis.
 * Aqui fica a grafia usada nas páginas de distrito, indexada pelo slug, que
 * não muda. Um distrito que não esteja na lista cai no nome da base de dados
 * com "em", sem partir nada.
 */
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
