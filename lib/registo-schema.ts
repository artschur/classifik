import { z } from 'zod';
import type { Locale } from './i18n';

/**
 * Esquemas do registo e da edição do perfil de anunciante, partilhados entre o
 * formulário (navegador) e as acções que gravam (servidor), para as duas
 * pontas validarem igual. Ficam fora do formulário porque esse é 'use client':
 * importado de lá, um valor chega ao servidor como referência, não como o
 * objecto.
 *
 * O registo tem cinco passos: 1 informações, 2 localização, 3 fotos (o perfil
 * é criado no primeiro upload), 4 verificação e 5 o resto do perfil, todo
 * opcional.
 */

// Vazio no formulário quer dizer "não preenchido". O 0 também: era o valor
// com que os perfis sem peso ou altura chegavam ao formulário.
const vazio = (v: unknown) =>
  v === '' || v === null || v === undefined || v === 0 || (typeof v === 'number' && Number.isNaN(v))
    ? undefined
    : v;

/** O género gravado, a partir do que vier (há perfis antigos em minúsculas). */
const GENERO_CANONICO: Record<string, 'Feminino' | 'Masculino' | 'Trans'> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  trans: 'Trans',
};
const GENEROS_VALIDOS: string[] = Object.values(GENERO_CANONICO);

const numeroOpcional = (min: number, max: number, mensagem: string) =>
  z.preprocess(vazio, z.coerce.number().min(min, mensagem).max(max, mensagem).optional());

// Texto livre e tolerante: há perfis antigos com valores fora das listas do
// formulário (cor dos olhos "Castanho", por exemplo), e exigir a lista
// impedia-os de guardar qualquer outra alteração.
const textoOpcional = (max: number, mensagem?: string) =>
  z.preprocess(vazio, z.string().trim().max(max, mensagem).optional());

/**
 * Mensagens de validação em cada idioma. O português é o de sempre; o inglês
 * serve a versão /en do formulário (e as respostas do servidor a esse pedido).
 */
const MENSAGENS = {
  pt: {
    nomeMin: 'Nome precisa ter ao menos 2 caractéres',
    nomeMax: 'O nome pode ter no máximo 100 caracteres',
    telefoneMin: 'Numero de telefone precisa ter ao menos 8 caractéres',
    telefoneMax: 'Número de telefone inválido',
    descricaoMin: 'Descrição precisa ter ao menos 30 caractéres',
    descricaoMax: 'Descrição não pode ter mais de 500 caractéres',
    precoPositivo: 'Seu preço precisa ser positivo',
    precoMax: 'Preço inválido',
    idadeMin: 'Você precisa ter mais de 18 anos!',
    generoObrigatorio: 'Gênero é obrigatório',
    termos: 'Confirme que tem 18 anos ou mais e que aceita os termos',
    concelhoObrigatorio: 'Concelho é obrigatório',
    cidadeObrigatoria: 'Cidade é obrigatória',
    estadoTamanho: 'Estado precisa conter ao menos 2 caractéres',
    paisObrigatorio: 'País é obrigatório',
    descricaoCurtaMax: 'Descrição curta pode ter no máximo 150 caractéres',
    instagramMax: 'O Instagram pode ter no máximo 40 caracteres',
    peso: 'Peso entre 30 e 300 kg',
    altura: 'Altura entre 1,30 e 2,50 m',
  },
  en: {
    nomeMin: 'Your name needs at least 2 characters',
    nomeMax: 'Your name can be at most 100 characters',
    telefoneMin: 'Your phone number needs at least 8 characters',
    telefoneMax: 'Invalid phone number',
    descricaoMin: 'Your description needs at least 30 characters',
    descricaoMax: 'Your description cannot be longer than 500 characters',
    precoPositivo: 'Your price must be a positive number',
    precoMax: 'Invalid price',
    idadeMin: 'You must be 18 or over',
    generoObrigatorio: 'Please choose your gender',
    termos: 'Please confirm that you are 18 or over and that you accept the terms',
    concelhoObrigatorio: 'Please enter your municipality',
    cidadeObrigatoria: 'Please choose your district',
    estadoTamanho: 'Please choose your district',
    paisObrigatorio: 'Please choose your district',
    descricaoCurtaMax: 'Your short description can be at most 150 characters',
    instagramMax: 'Your Instagram handle can be at most 40 characters',
    peso: 'Weight must be between 30 and 300 kg',
    altura: 'Height must be between 1.30 and 2.50 m',
  },
} satisfies Record<Locale, Record<string, string>>;

type Mensagens = (typeof MENSAGENS)['pt'];

/** Os esquemas todos, com as mensagens de um idioma. Os valores validados são iguais nos dois. */
function criarEsquemas(m: Mensagens) {
  /** Passo 1: o mínimo para o anúncio existir. */
  const informacoesSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, m.nomeMin)
      .max(100, m.nomeMax),
    phoneNumber: z
      .string()
      .min(8, m.telefoneMin)
      .max(20, m.telefoneMax),
    description: z
      .string()
      .min(30, m.descricaoMin)
      .max(500, m.descricaoMax),
    price: z
      .number({ invalid_type_error: m.precoPositivo })
      .min(1, m.precoPositivo)
      .max(10000, m.precoMax),
    age: z.number().min(18, m.idadeMin).max(100),
    // Só Feminino, Masculino ou Trans (os do filtro do site). Os perfis antigos
    // gravados em minúsculas ("feminino") continuam a passar, já normalizados.
    gender: z.preprocess(
      (v) => (typeof v === 'string' ? GENERO_CANONICO[v.trim().toLowerCase()] ?? v : v),
      z.string().refine((v) => GENEROS_VALIDOS.includes(v), m.generoObrigatorio),
    ),
  });

  /**
   * Declaração obrigatória antes de o perfil ser criado. Pesa mais desde que um
   * perfil pode ir para o ar sem documento visto.
   */
  const termosSchema = z.object({
    aceitouTermos: z.literal(true, {
      errorMap: () => ({
        message: m.termos,
      }),
    }),
  });

  /** Passo 2. */
  const localizacaoSchema = z.object({
    neighborhood: z.string().trim().min(1, m.concelhoObrigatorio).max(100),
    city: z.number().min(1, m.cidadeObrigatoria),
    state: z.string().length(2, m.estadoTamanho),
    country: z.string().min(1, m.paisObrigatorio),
    meets_at_hotel: z.boolean().default(false),
    meets_at_own_place: z.boolean().default(false),
  });

  /**
   * Passo 5: o resto do perfil. Nada é obrigatório; quando vem preenchido, os
   * limites valem.
   */
  const completarPerfilSchema = z.object({
    shortDescription: textoOpcional(150, m.descricaoCurtaMax),
    instagramHandle: textoOpcional(40, m.instagramMax),
    gender_identity: textoOpcional(100),
    languages: z.array(z.string().max(30)).max(10).default([]),
    weight: numeroOpcional(30, 300, m.peso),
    height: z.preprocess(
      (v) => vazio(typeof v === 'string' ? Number(v.replace(',', '.')) : v),
      z.coerce
        .number()
        .min(1.3, m.altura)
        .max(2.5, m.altura)
        .optional(),
    ),
    ethnicity: textoOpcional(50),
    eye_color: textoOpcional(30),
    hair_color: textoOpcional(30),
    hair_length: textoOpcional(30),
    shoe_size: z.preprocess(vazio, z.coerce.number().int().min(15).max(60).optional()),
    silicone: z.boolean().default(false),
    tattoos: z.boolean().default(false),
    piercings: z.boolean().default(false),
    smoker: z.boolean().default(false),
  });

  return {
    informacoesSchema,
    termosSchema,
    localizacaoSchema,
    completarPerfilSchema,
    /** Registo novo, até ao passo 3: é o que cria o perfil. */
    registoNovoSchema: informacoesSchema.merge(termosSchema).merge(localizacaoSchema),
    /** Edição de um perfil que já existe: tudo, com o passo 5 opcional. */
    edicaoPerfilSchema: informacoesSchema
      .merge(localizacaoSchema)
      .merge(completarPerfilSchema),
  };
}

const ESQUEMAS = { pt: criarEsquemas(MENSAGENS.pt), en: criarEsquemas(MENSAGENS.en) };

/** Os esquemas com as mensagens no idioma do pedido. */
export function esquemasRegisto(locale: Locale) {
  return ESQUEMAS[locale];
}

// Os de sempre, em português: há código que os importa directamente.
export const {
  informacoesSchema,
  termosSchema,
  localizacaoSchema,
  completarPerfilSchema,
  registoNovoSchema,
  edicaoPerfilSchema,
} = ESQUEMAS.pt;

export type RegisterCompanionFormValues = z.infer<typeof edicaoPerfilSchema> & {
  /** Só no registo novo: a caixa do passo 1. */
  aceitouTermos?: boolean;
  email?: string;
};

export type RegistoNovoInput = z.infer<typeof registoNovoSchema>;
export type CompletarPerfilInput = z.infer<typeof completarPerfilSchema>;

/** Campos de cada passo, para levar a anunciante até ao campo com erro. */
export const CAMPOS_INFORMACOES = Object.keys(informacoesSchema.shape);
export const CAMPOS_LOCALIZACAO = Object.keys(localizacaoSchema.shape);
export const CAMPOS_COMPLETAR = Object.keys(completarPerfilSchema.shape);

/**
 * As características contam como vazias quando nenhuma das que se escrevem
 * foi preenchida. Os interruptores (silicone, tatuagens...) ficam de fora:
 * começam em "não" e não dizem se ela chegou a olhar para eles.
 */
export function caracteristicasVazias(c: {
  weight?: unknown;
  height?: unknown;
  ethnicity?: unknown;
  eye_color?: unknown;
  hair_color?: unknown;
  hair_length?: unknown;
  shoe_size?: unknown;
}): boolean {
  return [c.weight, c.height, c.ethnicity, c.eye_color, c.hair_color, c.hair_length, c.shoe_size].every(
    (v) => vazio(v) === undefined,
  );
}

/**
 * Valores das características prontos para a base: o que não foi preenchido
 * vai a null. Recebe também os rascunhos antigos guardados à espera de
 * revisão, que ainda trazem as características no formato de antes.
 */
export function caracteristicasParaBase(data: Partial<CompletarPerfilInput>) {
  const numero = (v: unknown) => {
    const n = vazio(v) === undefined ? NaN : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const texto = (v: unknown) => {
    const t = typeof v === 'string' ? v.trim() : '';
    return t ? t : null;
  };
  const peso = numero(data.weight);
  const altura = numero(data.height);
  const pe = numero(data.shoe_size);
  return {
    weight: peso !== null ? String(peso) : null,
    height: altura !== null ? String(altura) : null,
    ethnicity: texto(data.ethnicity),
    eye_color: texto(data.eye_color),
    hair_color: texto(data.hair_color),
    hair_length: texto(data.hair_length),
    shoe_size: pe !== null ? Math.round(pe) : null,
    silicone: Boolean(data.silicone),
    tattoos: Boolean(data.tattoos),
    piercings: Boolean(data.piercings),
    smoker: Boolean(data.smoker),
  };
}
