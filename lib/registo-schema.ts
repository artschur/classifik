import { z } from 'zod';

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

const numeroOpcional = (min: number, max: number, mensagem: string) =>
  z.preprocess(vazio, z.coerce.number().min(min, mensagem).max(max, mensagem).optional());

// Texto livre e tolerante: há perfis antigos com valores fora das listas do
// formulário (cor dos olhos "Castanho", por exemplo), e exigir a lista
// impedia-os de guardar qualquer outra alteração.
const textoOpcional = (max: number, mensagem?: string) =>
  z.preprocess(vazio, z.string().trim().max(max, mensagem).optional());

/** Passo 1: o mínimo para o anúncio existir. */
export const informacoesSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome precisa ter ao menos 2 caractéres')
    .max(100, 'O nome pode ter no máximo 100 caracteres'),
  phoneNumber: z
    .string()
    .min(8, 'Numero de telefone precisa ter ao menos 8 caractéres')
    .max(20, 'Número de telefone inválido'),
  description: z
    .string()
    .min(30, 'Descrição precisa ter ao menos 30 caractéres')
    .max(500, 'Descrição não pode ter mais de 500 caractéres'),
  price: z
    .number({ invalid_type_error: 'Seu preço precisa ser positivo' })
    .min(1, 'Seu preço precisa ser positivo')
    .max(10000, 'Preço inválido'),
  age: z.number().min(18, 'Você precisa ter mais de 18 anos!').max(100),
  gender: z.string().min(1, 'Gênero é obrigatório'),
});

/**
 * Declaração obrigatória antes de o perfil ser criado. Pesa mais desde que um
 * perfil pode ir para o ar sem documento visto.
 */
export const termosSchema = z.object({
  aceitouTermos: z.literal(true, {
    errorMap: () => ({
      message: 'Confirme que tem 18 anos ou mais e que aceita os termos',
    }),
  }),
});

/** Passo 2. */
export const localizacaoSchema = z.object({
  neighborhood: z.string().trim().min(1, 'Concelho é obrigatório').max(100),
  city: z.number().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado precisa conter ao menos 2 caractéres'),
  country: z.string().min(1, 'País é obrigatório'),
  meets_at_hotel: z.boolean().default(false),
  meets_at_own_place: z.boolean().default(false),
});

/**
 * Passo 5: o resto do perfil. Nada é obrigatório; quando vem preenchido, os
 * limites valem.
 */
export const completarPerfilSchema = z.object({
  shortDescription: textoOpcional(150, 'Descrição curta pode ter no máximo 150 caractéres'),
  instagramHandle: textoOpcional(40, 'O Instagram pode ter no máximo 40 caracteres'),
  gender_identity: textoOpcional(100),
  languages: z.array(z.string().max(30)).max(10).default([]),
  weight: numeroOpcional(30, 300, 'Peso entre 30 e 300 kg'),
  height: z.preprocess(
    (v) => vazio(typeof v === 'string' ? Number(v.replace(',', '.')) : v),
    z.coerce
      .number()
      .min(1.3, 'Altura entre 1,30 e 2,50 m')
      .max(2.5, 'Altura entre 1,30 e 2,50 m')
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

/** Registo novo, até ao passo 3: é o que cria o perfil. */
export const registoNovoSchema = informacoesSchema.merge(termosSchema).merge(localizacaoSchema);

/** Edição de um perfil que já existe: tudo, com o passo 5 opcional. */
export const edicaoPerfilSchema = informacoesSchema
  .merge(localizacaoSchema)
  .merge(completarPerfilSchema);

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
