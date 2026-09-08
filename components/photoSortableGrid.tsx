'use client';

import Image from 'next/image';
import { Check, Crop, GripVertical, Star, X } from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { framingStyle } from '@/lib/image-framing';

export type ManagedImage = {
  publicUrl: string;
  storagePath: string;
  focalX?: number;
  focalY?: number;
  zoom?: number;
};

interface PhotoSortableGridProps {
  images: ManagedImage[];
  selected: Set<string>;
  onToggleSelect: (storagePath: string) => void;
  onReorder: (images: ManagedImage[]) => void;
  onRequestDelete: (storagePath: string) => void;
  onEditFraming: (image: ManagedImage) => void;
}

const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

function SortableTile({
  image,
  index,
  isSelected,
  onToggleSelect,
  onRequestDelete,
  onEditFraming,
}: {
  image: ManagedImage;
  index: number;
  isSelected: boolean;
  onToggleSelect: (storagePath: string) => void;
  onRequestDelete: (storagePath: string) => void;
  onEditFraming: (image: ManagedImage) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.storagePath });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const video = isVideo(image.publicUrl);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative aspect-square rounded-md overflow-hidden group',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'z-50 opacity-80 shadow-xl',
      )}
    >
      {video ? (
        <video
          src={image.publicUrl}
          className="w-full h-full object-cover"
          style={framingStyle(image)}
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <Image
          src={image.publicUrl}
          alt={`Foto ${index + 1}`}
          fill
          className="object-cover"
          style={framingStyle(image)}
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      )}

      {/* Área de arrastar. Fica por cima da foto toda menos dos cantos, onde
          estão os botões, e o dnd-kit só inicia o arrasto depois de uns pixels
          de movimento, para um toque simples continuar a seleccionar. */}
      <button
        type="button"
        aria-label={`Arrastar foto ${index + 1} para reordenar`}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onClick={() => onToggleSelect(image.storagePath)}
        {...attributes}
        {...listeners}
      />

      {index === 0 && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground pointer-events-none">
          <Star className="h-3 w-3 fill-current" />
          Capa
        </span>
      )}

      <div className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1 text-white pointer-events-none md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4" />
      </div>

      {!video && (
        <button
          type="button"
          aria-label={`Ajustar enquadramento da foto ${index + 1}`}
          onClick={(event) => {
            event.stopPropagation();
            onEditFraming(image);
          }}
          className="absolute top-2 left-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
        >
          <Crop className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        aria-label={`Remover foto ${index + 1}`}
        onClick={(event) => {
          event.stopPropagation();
          onRequestDelete(image.storagePath);
        }}
        className="absolute top-2 right-2 rounded-full bg-red-500 p-1 hover:bg-red-600 transition-colors"
      >
        <X className="h-4 w-4 text-white" />
      </button>

      {isSelected && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary pointer-events-none">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

export function PhotoSortableGrid({
  images,
  selected,
  onToggleSelect,
  onReorder,
  onRequestDelete,
  onEditFraming,
}: PhotoSortableGridProps) {
  const sensors = useSensors(
    // A distância mínima evita que tocar para seleccionar seja lido como
    // arrasto, e o atraso no toque deixa a página continuar a fazer scroll.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((image) => image.storagePath === active.id);
    const newIndex = images.findIndex((image) => image.storagePath === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(images, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((image) => image.storagePath)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <SortableTile
              key={image.storagePath}
              image={image}
              index={index}
              isSelected={selected.has(image.storagePath)}
              onToggleSelect={onToggleSelect}
              onRequestDelete={onRequestDelete}
              onEditFraming={onEditFraming}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
