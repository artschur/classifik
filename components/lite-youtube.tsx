'use client';

/**
 * LiteYouTube (v2) — componente de fachada ("facade") para embeds YouTube.
 *
 * PROBLEMA RESOLVIDO
 * Um embed YouTube padrão carrega ~1.4 MB de scripts no load da página, mesmo
 * que o vídeo nunca seja reproduzido. O PageSpeed sinaliza isso como
 * "Reduce Unused JavaScript". Esta fachada mostra só a miniatura + botão de
 * play; o iframe (e seus scripts) só carrega ao clicar.
 *
 * MUDANÇAS NA v2
 *  - Aceita ID (11 chars) OU URL completa (watch, youtu.be, embed, shorts).
 *  - Fallback automático de miniatura: maxresdefault.jpg não existe para todo
 *    vídeo; em erro, cai para hqdefault.jpg (que existe sempre).
 *  - Pré-conexão (preconnect) no primeiro hover/focus: "aquece" DNS+TLS para o
 *    clique ser instantâneo, sem custo no load inicial.
 *  - Prop `priority` para vídeos acima da dobra (melhora o LCP de verdade).
 *  - Foco movido para o iframe ao ativar (acessibilidade de teclado).
 *  - Parâmetros extra do player via `startAt` e `params`.
 *  - Validação/sanitização do ID antes de montar as URLs.
 *
 * USO
 *   import { LiteYouTube } from '@/components/lite-youtube';
 *   <LiteYouTube videoId="dQw4w9WgXcQ" title="Título do vídeo" />
 *   // ou colando a URL inteira:
 *   <LiteYouTube videoId="https://youtu.be/dQw4w9WgXcQ" title="..." priority />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type ThumbnailQuality = 'max' | 'hq' | 'mq' | 'sd';

const QUALITY_FILENAME: Record<ThumbnailQuality, string> = {
  max: 'maxresdefault',
  hq: 'hqdefault',
  mq: 'mqdefault',
  sd: 'sddefault',
};

// Domínios contactados quando o iframe carrega. Pré-conectar a eles no
// primeiro hover/focus deixa a conexão pronta para o clique.
const PRECONNECT_DOMAINS = [
  'https://www.youtube-nocookie.com',
  'https://i.ytimg.com',
  'https://www.google.com',
  'https://googleads.g.doubleclick.net',
  'https://static.doubleclick.net',
];

let connectionsWarmed = false;
function warmConnections() {
  if (connectionsWarmed || typeof document === 'undefined') return;
  connectionsWarmed = true;
  for (const href of PRECONNECT_DOMAINS) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = ''; // anónimo
    document.head.appendChild(link);
  }
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/** Aceita um ID de 11 caracteres OU uma URL do YouTube (watch, youtu.be, embed, shorts). */
function extractVideoId(input: string): string {
  const value = (input ?? '').trim();
  if (ID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1, 12);
      if (ID_PATTERN.test(id)) return id;
    }
    const fromPath = url.pathname.match(/\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
    if (fromPath) return fromPath[1];
    const v = url.searchParams.get('v');
    if (v && ID_PATTERN.test(v)) return v;
  } catch {
    // não é uma URL — segue para o fallback
  }

  // Último recurso: mantém só caracteres válidos
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
}

interface LiteYouTubeProps {
  /** ID do vídeo (11 chars) OU uma URL completa do YouTube. */
  videoId: string;
  /** Texto acessível (aria-label e alt da miniatura). */
  title?: string;
  /** Classes Tailwind adicionais para o container. */
  className?: string;
  /** Qualidade da miniatura. Padrão: 'hq' (sempre existe). */
  quality?: ThumbnailQuality;
  /** Segundo a partir do qual o vídeo começa. */
  startAt?: number;
  /** Parâmetros extra para a query do embed, ex.: { cc_load_policy: 1, hl: 'pt' }. */
  params?: Record<string, string | number>;
  /**
   * Marque `true` quando o vídeo está acima da dobra (above the fold):
   * a miniatura carrega com prioridade, ajudando o LCP. Padrão: false.
   */
  priority?: boolean;
}

export function LiteYouTube({
  videoId,
  title = 'Vídeo',
  className = '',
  quality = 'hq',
  startAt,
  params,
  priority = false,
}: LiteYouTubeProps) {
  const [activated, setActivated] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const id = extractVideoId(videoId);

  // Miniatura: tenta a qualidade pedida; em erro (ex.: maxresdefault ausente)
  // cai para hqdefault, que existe para qualquer vídeo.
  const thumbFile = thumbFailed ? 'hqdefault' : QUALITY_FILENAME[quality];
  const thumbnailUrl = `https://i.ytimg.com/vi/${id}/${thumbFile}.jpg`;

  // Constrói a URL do embed. Nota: `rel=0` hoje só limita "vídeos relacionados"
  // ao mesmo canal — o YouTube não desativa mais essa seção por completo.
  const search = new URLSearchParams({ autoplay: '1', rel: '0' });
  if (startAt && startAt > 0) search.set('start', String(Math.floor(startAt)));
  if (params) {
    for (const [key, val] of Object.entries(params)) search.set(key, String(val));
  }
  const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?${search.toString()}`;

  // Move o foco para o iframe ao ativar (teclado / leitores de tela).
  useEffect(() => {
    if (activated) iframeRef.current?.focus();
  }, [activated]);

  const handleActivate = useCallback(() => setActivated(true), []);
  const handleThumbError = useCallback(() => setThumbFailed((f) => f || true), []);

  // Depois de clicar: carrega o iframe real do YouTube.
  if (activated) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg ${className}`}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  // Estado inicial: miniatura + botão de play.
  return (
    <button
      type="button"
      onClick={handleActivate}
      onPointerOver={warmConnections}
      onFocus={warmConnections}
      aria-label={`Reproduzir vídeo: ${title}`}
      className={`
        group relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black
        focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2
        ${className}
      `}
    >
      {/* Miniatura do vídeo */}
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        className="object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-100"
        unoptimized
        priority={priority}
        onError={handleThumbError}
      />

      {/* Overlay escuro sutil */}
      <div className="absolute inset-0 bg-black/20 transition-colors duration-200 group-hover:bg-black/10" />

      {/* Botão de play — estilo YouTube */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 shadow-xl transition-all duration-200 group-hover:scale-110 group-hover:bg-rose-500"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Título (aparece no hover) */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-left text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {title}
      </span>
    </button>
  );
}