import type { Locale } from '@/lib/i18n';

/**
 * Textos que dependem do género do perfil. O género vem gravado como
 * 'Feminino', 'Masculino' ou 'Trans' (há perfis antigos em minúsculas).
 */
function chave(genero: string | null | undefined): 'feminino' | 'masculino' | 'trans' | null {
  const g = (genero ?? '').trim().toLowerCase();
  return g === 'feminino' || g === 'masculino' || g === 'trans' ? g : null;
}

/**
 * Selo de verificação concordante com o género: "Verificado" num perfil
 * masculino, "Verificada" nos restantes (a maioria dos perfis, e o que o
 * site sempre mostrou).
 */
export function seloVerificacao(genero: string | null | undefined, locale: Locale) {
  if (locale === 'en') return { verificado: 'Verified', naoVerificado: 'Not verified' };
  return chave(genero) === 'masculino'
    ? { verificado: 'Verificado', naoVerificado: 'Não verificado' }
    : { verificado: 'Verificada', naoVerificado: 'Não verificada' };
}

/**
 * Etiqueta na foto dos cartões, só para perfis masculinos e trans. Nos
 * femininos não aparece: são quase todos, e o cartão já diz "Mulher".
 * Serve para quem procura uma coisa não clicar por engano na outra.
 */
export function etiquetaGenero(genero: string | null | undefined, locale: Locale): string | null {
  const g = chave(genero);
  if (g === 'masculino') return locale === 'en' ? 'Male' : 'Masculino';
  if (g === 'trans') return 'Trans';
  return null;
}
