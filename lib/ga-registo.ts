import { gaEvent } from '@/lib/ga';

/**
 * Medição do registo de anunciantes no GA4, passo a passo.
 *
 * O percurso tem cinco passos (os mesmos do indicador "Passo N de 5"):
 * 1 informações, 2 localização e 3 fotos no formulário; 4 verificação e
 * 5 "sobre si" em páginas próprias. Antes deles vem a conta (sign_up) e,
 * depois, a escolha de um plano (begin_checkout e, no servidor, a
 * assinatura_concluida da Stripe).
 *
 * Nenhum evento leva dados pessoais: só números de passo, nomes de campo
 * (nunca o que foi escrito) e tipos de erro.
 */

export const NOMES_PASSOS = ['informacoes', 'localizacao', 'fotos', 'verificacao', 'sobre_si'] as const;
export type PassoRegisto = 1 | 2 | 3 | 4 | 5;

/** Uma vez por sessão do navegador e por chave, para recarregar a página ou voltar atrás não contar duas vezes. */
function primeiraVez(chave: string): boolean {
  try {
    const k = `ga-registo:${chave}`;
    if (sessionStorage.getItem(k)) return false;
    sessionStorage.setItem(k, '1');
    return true;
  } catch {
    // Sem sessionStorage (modo privado em alguns navegadores): mede na mesma.
    return true;
  }
}

/** Ela chegou a um passo do registo. */
export function medirPasso(passo: PassoRegisto): void {
  if (!primeiraVez(`passo-${passo}`)) return;
  gaEvent('registo_passo', { passo, nome_passo: NOMES_PASSOS[passo - 1] });
}

/**
 * Tentou avançar ou guardar com campos por preencher ou inválidos. Vai o
 * primeiro campo (para o relatório por campo) e a lista, cortada a 100
 * caracteres, que é o limite de um parâmetro no GA4.
 */
export function medirErroPasso(passo: PassoRegisto, campos: string[]): void {
  const unicos = [...new Set(campos.filter(Boolean))];
  if (!unicos.length) return;
  gaEvent('registo_erro', {
    passo,
    nome_passo: NOMES_PASSOS[passo - 1],
    campo: unicos[0],
    campos: unicos.join(',').slice(0, 100),
  });
}

/**
 * Conta criada há pouco: é a primeira vez que esta conta chega ao formulário.
 * O Clerk cria a conta fora do site, por isso é aqui que se vê. O GA4 trata
 * sign_up como evento recomendado.
 */
export function medirContaCriada(userId: string, criadaEm: Date | null | undefined, metodo: string): void {
  if (!criadaEm || Date.now() - criadaEm.getTime() > 30 * 60 * 1000) return;
  try {
    const k = `ga-registo:sign-up:${userId}`;
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, '1');
  } catch {
    if (!primeiraVez(`sign-up-${userId}`)) return;
  }
  gaEvent('sign_up', { method: metodo, tipo_conta: 'anunciante' });
}

/** O perfil foi criado (na primeira foto) e entrou na fila de aprovação. */
export function medirPerfilCriado(): void {
  gaEvent('registo_perfil_criado');
}

export type PecaVerificacao = 'video' | 'documento';

/** Vídeo ou documento de verificação enviado com sucesso. */
export function medirVerificacaoEnviada(peca: PecaVerificacao): void {
  gaEvent('verificacao_enviada', { peca });
}

/** Falha ao enviar o vídeo ou o documento: ficheiro grande demais, formato errado ou erro no envio. */
export function medirVerificacaoErro(peca: PecaVerificacao, motivo: 'tamanho' | 'formato' | 'envio'): void {
  gaEvent('verificacao_erro', { peca, motivo });
}

/** Escolheu "Pular por agora" na verificação. */
export function medirVerificacaoPulada(): void {
  gaEvent('verificacao_pulada');
}

/** Guardou o passo 5: o registo ficou completo. */
export function medirRegistoConcluido(): void {
  gaEvent('registo_concluido');
}
