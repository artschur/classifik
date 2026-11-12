/** Linhas por página nas listas grandes do /verify (Importadas, Em pausa, Inglês). */
export const POR_PAGINA = 40;

/** O número da página do endereço (?pag=), a partir de 1. */
export function paginaDe(valor: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(valor) ? valor[0] : (valor ?? ''), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10000) : 1;
}
