import type { CSSProperties } from 'react';
import type { Media } from '@/types/types';

export const DEFAULT_FRAMING = { focalX: 50, focalY: 50, zoom: 100 } as const;

export type Framing = {
  focalX: number;
  focalY: number;
  zoom: number;
};

/**
 * O enquadramento é guardado por foto e aplicado só na altura de mostrar, sem
 * tocar no ficheiro original. Como o mesmo recorte tem de sair igual na grelha
 * do perfil, no cartão da listagem e no editor, a conta vive toda aqui.
 *
 * O ponto focal escolhe que parte da foto preenche a moldura (é o
 * object-position) e o zoom amplia a partir desse mesmo ponto, para a zona que
 * a anunciante centrou não fugir quando ela aproxima.
 */
export function framingStyle(framing?: Partial<Framing> | null): CSSProperties {
  const focalX = framing?.focalX ?? DEFAULT_FRAMING.focalX;
  const focalY = framing?.focalY ?? DEFAULT_FRAMING.focalY;
  const zoom = framing?.zoom ?? DEFAULT_FRAMING.zoom;

  const style: CSSProperties = {
    objectPosition: `${focalX}% ${focalY}%`,
  };

  if (zoom !== 100) {
    style.transform = `scale(${zoom / 100})`;
    style.transformOrigin = `${focalX}% ${focalY}%`;
  }

  return style;
}

/** Aceita tanto o URL solto que ainda circula no código antigo como o objecto. */
export function mediaUrl(media: string | Media): string {
  return typeof media === 'string' ? media : media.publicUrl;
}

export function mediaFraming(media: string | Media): Framing {
  if (typeof media === 'string') return { ...DEFAULT_FRAMING };
  return {
    focalX: media.focalX ?? DEFAULT_FRAMING.focalX,
    focalY: media.focalY ?? DEFAULT_FRAMING.focalY,
    zoom: media.zoom ?? DEFAULT_FRAMING.zoom,
  };
}
