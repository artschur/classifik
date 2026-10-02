import type { Locale } from './i18n';

/**
 * Valores escolhidos no formulário de registo (sempre em português) e a
 * tradução para a versão inglesa. Um valor que não esteja aqui aparece como
 * foi gravado.
 */
export const VALORES_EN: Record<string, string> = {
  Branco: 'White',
  Branca: 'White',
  Negro: 'Black',
  Negra: 'Black',
  Latino: 'Latina',
  Latina: 'Latina',
  'Asiático': 'Asian',
  'Asiática': 'Asian',
  Azul: 'Blue',
  Verde: 'Green',
  Marrom: 'Brown',
  Castanho: 'Brown',
  Preto: 'Black',
  Loiro: 'Blonde',
  Vermelho: 'Red',
  Ruivo: 'Red',
  Cinza: 'Grey',
  Colorido: 'Dyed',
  'Português': 'Portuguese',
  'Inglês': 'English',
  Espanhol: 'Spanish',
  'Francês': 'French',
  'Alemão': 'German',
  Italiano: 'Italian',
};

export function traduzirValor(valor: string | null | undefined, locale: Locale): string {
  if (!valor) return 'N/A';
  return locale === 'en' ? VALORES_EN[valor.trim()] ?? valor : valor;
}
