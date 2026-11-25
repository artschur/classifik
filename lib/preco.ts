/**
 * Preço como aparece nos cartões das listagens: "300 €", à maneira
 * portuguesa. Sem preço, ou com 0 (perfis criados pelo admin ainda sem
 * valor), "Preço a combinar" em vez de "€ 0.00".
 */
export function precoCartao(preco: number | string | null | undefined, locale: string): string {
  const valor = typeof preco === 'string' ? Number(preco) : preco;
  if (valor == null || !Number.isFinite(valor) || valor <= 0) {
    return locale === 'en' ? 'Price on request' : 'Preço a combinar';
  }
  const numero = valor.toLocaleString(locale === 'en' ? 'en-GB' : 'pt-PT', {
    maximumFractionDigits: 2,
  });
  return locale === 'en' ? `€${numero}` : `${numero} €`;
}
