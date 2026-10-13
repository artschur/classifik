import { z } from 'zod';

/**
 * Formulário de aprovação de uma candidata importada: o que o admin confirma
 * antes de o perfil ficar online. Partilhado entre o formulário (navegador) e
 * a acção que cria o perfil (servidor), para as duas pontas validarem igual.
 *
 * As listas são as mesmas do registo normal (components/formCompanionRegister),
 * para os perfis importados aparecerem nos mesmos filtros.
 */
export const ETNIAS = ['Branco', 'Negro', 'Latino', 'Asiático'] as const;
export const CORES_OLHOS = ['Azul', 'Verde', 'Marrom', 'Preto'] as const;
export const CORES_CABELO = ['Loiro', 'Castanho', 'Preto', 'Vermelho', 'Cinza', 'Branco', 'Colorido'] as const;
export const IDIOMAS = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano'] as const;
export const CANAIS_CONSENTIMENTO = ['whatsapp', 'chamada', 'sms', 'email', 'outro'] as const;

export const approvalSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório').max(100),
  age: z.coerce.number().int().min(18, 'Tem de ter 18 anos ou mais').max(99),
  cityId: z.coerce.number().int().positive('Escolha o distrito'),
  price: z.coerce.number().int().min(1, 'Preço obrigatório').max(10000),
  ethnicity: z.enum(ETNIAS, { message: 'Escolha a etnia' }),
  hairColor: z.enum(CORES_CABELO, { message: 'Escolha a cor do cabelo' }),
  eyeColor: z.enum(CORES_OLHOS).nullable(),
  height: z.coerce.number().min(1.3, 'Altura entre 1,30 e 2,20 m').max(2.2, 'Altura entre 1,30 e 2,20 m'),
  weight: z.coerce.number().min(35, 'Peso entre 35 e 200 kg').max(200, 'Peso entre 35 e 200 kg'),
  languages: z.array(z.enum(IDIOMAS)).min(1, 'Escolha pelo menos um idioma'),
  shortDescription: z.string().trim().max(150).optional().default(''),
  description: z.string().trim().min(10, 'Descrição obrigatória').max(5000),
  meetsAtHotel: z.boolean().default(false),
  meetsAtOwnPlace: z.boolean().default(false),
  photos: z.array(z.string().min(1)).min(1, 'Escolha pelo menos uma foto'),
  // Criado escondido: o admin vê o perfil como vai ficar e só o põe no ar
  // quando reactivar no separador "Em pausa" do /verify.
  publishPaused: z.boolean().default(true),
});

export type ApprovalInput = z.infer<typeof approvalSchema>;

/**
 * Rascunho guardado sem publicar: os mesmos campos, todos opcionais, e sem as
 * regras de mínimo (um nome ainda por escrever não impede guardar o resto).
 */
export const draftSchema = z.object({
  name: z.string().trim().max(100).optional(),
  age: z.string().max(3).optional(),
  cityId: z.string().max(6).optional(),
  price: z.string().max(6).optional(),
  ethnicity: z.string().max(30).optional(),
  hairColor: z.string().max(30).optional(),
  eyeColor: z.string().max(30).optional(),
  height: z.string().max(6).optional(),
  weight: z.string().max(6).optional(),
  languages: z.array(z.enum(IDIOMAS)).optional(),
  shortDescription: z.string().max(150).optional(),
  description: z.string().max(5000).optional(),
  meetsAtHotel: z.boolean().optional(),
  meetsAtOwnPlace: z.boolean().optional(),
  photos: z.array(z.string().min(1)).max(50).optional(),
});

export type Draft = z.infer<typeof draftSchema>;

export const consentSchema = z.object({
  canal: z.enum(CANAIS_CONSENTIMENTO),
  notas: z.string().trim().max(1000).optional().default(''),
});

export type ConsentInput = z.infer<typeof consentSchema>;

/** Valores de partida do formulário, a partir do que veio no anúncio. */
export type ApprovalPrefill = {
  age: number | null;
  cityId: number | null;
  height: number | null;
  weight: number | null;
  eyeColor: (typeof CORES_OLHOS)[number] | null;
  languages: (typeof IDIOMAS)[number][];
  description: string;
};

const numero = (texto: string | null) => {
  const m = String(texto ?? '').replace(',', '.').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

export function buildPrefill(c: {
  idadeTexto: string | null;
  cityId: number | null;
  altura: string | null;
  peso: string | null;
  olhos: string | null;
  idiomas: string[];
  descricao: string | null;
}): ApprovalPrefill {
  // O anúncio mostra uma faixa ("23/29"): por decisão da OneSugar, o
  // formulário parte do limite de baixo, e o admin corrige se souber outra.
  const idade = numero(c.idadeTexto);

  // "1,62 M" ou "162 cm"
  let altura = numero(c.altura);
  if (altura !== null && altura > 3) altura = altura / 100;

  const olhos = String(c.olhos ?? '').toLowerCase();
  const eyeColor = olhos.startsWith('castanh')
    ? 'Marrom'
    : olhos.startsWith('verde')
      ? 'Verde'
      : olhos.startsWith('azu')
        ? 'Azul'
        : olhos.startsWith('pret')
          ? 'Preto'
          : null;

  return {
    age: idade !== null && idade >= 18 ? idade : null,
    cityId: c.cityId,
    height: altura !== null && altura >= 1.3 && altura <= 2.2 ? Math.round(altura * 100) / 100 : null,
    weight: numero(c.peso),
    eyeColor,
    languages: c.idiomas.filter((i): i is (typeof IDIOMAS)[number] => (IDIOMAS as readonly string[]).includes(i)),
    description: c.descricao ?? '',
  };
}
