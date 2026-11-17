import { absoluteUrl, hasEnglish } from '@/lib/i18n';

/**
 * IndexNow: avisa o Bing (e os outros buscadores do protocolo, como o
 * Yandex e o Seznam) de que uma página mudou, para ser rastreada logo em vez
 * de esperar pela próxima visita do robô. O índice do Bing alimenta também o
 * DuckDuckGo, o Yahoo e o ChatGPT.
 *
 * A chave é o ficheiro public/5bffa783fc10fb9f9fe31bd7e3e15176.txt, que prova
 * que o aviso vem do dono do site. Só corre em produção: os previews da
 * Vercel não podem avisar sobre endereços do site oficial.
 */
const CHAVE = '5bffa783fc10fb9f9fe31bd7e3e15176';
const HOST = 'www.onesugar.pt';

/** Caminhos em português; a versão /en entra quando existe. */
export async function avisarIndexNow(caminhos: string[]): Promise<void> {
  if (process.env.VERCEL_ENV !== 'production' || caminhos.length === 0) return;

  const urlList = [
    ...new Set(
      caminhos.flatMap((c) => [absoluteUrl(c, 'pt'), ...(hasEnglish(c) ? [absoluteUrl(c, 'en')] : [])]),
    ),
  ];

  try {
    const resposta = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: CHAVE,
        keyLocation: `https://${HOST}/${CHAVE}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(5000),
    });
    // 200 e 202 são os dois "recebido". Um erro aqui nunca afecta o site.
    if (!resposta.ok) console.warn(`IndexNow respondeu ${resposta.status} para ${urlList.length} endereços`);
  } catch (error) {
    console.warn('IndexNow: aviso não enviado', error);
  }
}
