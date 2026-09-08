'use client';

import * as React from 'react';
import Image from 'next/image';
import { Loader2, Move, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DEFAULT_FRAMING, framingStyle, type Framing } from '@/lib/image-framing';

interface ImageFramingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  initialFraming: Framing;
  isSaving?: boolean;
  onSave: (framing: Framing) => void;
}

const MIN_ZOOM = 100;
const MAX_ZOOM = 250;

export function ImageFramingDialog({
  open,
  onOpenChange,
  imageUrl,
  initialFraming,
  isSaving = false,
  onSave,
}: ImageFramingDialogProps) {
  const [framing, setFraming] = React.useState<Framing>(initialFraming);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);

  // Cada foto aberta recomeça do enquadramento que está guardado.
  React.useEffect(() => {
    if (open) setFraming(initialFraming);
  }, [open, initialFraming.focalX, initialFraming.focalY, initialFraming.zoom]);

  const applyPointer = (clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setFraming((current) => ({
      ...current,
      focalX: Math.min(100, Math.max(0, Math.round(x))),
      focalY: Math.min(100, Math.max(0, Math.round(y))),
    }));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    applyPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    applyPointer(event.clientX, event.clientY);
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar enquadramento</DialogTitle>
          <DialogDescription>
            Toca ou arrasta na foto para escolher o que fica centrado, e usa o
            zoom para aproximar. A foto original não é alterada.
          </DialogDescription>
        </DialogHeader>

        {imageUrl && (
          <div className="space-y-4">
            <div
              ref={frameRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-black cursor-crosshair touch-none select-none"
            >
              <Image
                src={imageUrl}
                alt="Pré-visualização do enquadramento"
                fill
                className="object-cover pointer-events-none"
                style={framingStyle(framing)}
                sizes="(max-width: 640px) 90vw, 420px"
              />
              <div
                className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.15)] pointer-events-none"
                style={{
                  left: `${framing.focalX}%`,
                  top: `${framing.focalY}%`,
                }}
              />
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white pointer-events-none">
                <Move className="h-3 w-3" />
                Arrasta para centrar
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="framing-zoom" className="font-medium">
                  Zoom
                </label>
                <span className="text-muted-foreground">{framing.zoom}%</span>
              </div>
              <input
                id="framing-zoom"
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={5}
                value={framing.zoom}
                onChange={(event) =>
                  setFraming((current) => ({
                    ...current,
                    zoom: Number(event.target.value),
                  }))
                }
                className="w-full accent-primary"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setFraming({ ...DEFAULT_FRAMING })}
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Repor
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => onSave(framing)} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
