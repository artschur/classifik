import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NurseCardProps {
  id: number;
  name: string;
  location: string;
  specialty: string;
  rating: number;
  hourlyRate: number;
  imageUrl: string;
}

export function NurseCard({ id, name, location, specialty, rating, hourlyRate, imageUrl }: NurseCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-2">
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={imageUrl || '/placeholder.svg'}
          width={300}
          height={300}
          alt={`Foto de ${name}`}
          className="object-cover transition-all group-hover:scale-105"
        />
        <Image
          src={'/watermark.png'}
          width={100}
          height={100}
          alt="Marca d'água"
          className="absolute inset-0 m-auto h-16 w-16 opacity-20"
        />
        <button
          className="absolute right-2 top-2 rounded-full bg-white p-2 text-primary shadow-sm"
          aria-label="Adicionar aos favoritos"
        >
          <Heart className="h-4 w-4" />
          <span className="sr-only">Adicionar aos favoritos</span>
        </button>
      </div>
      <div className="flex flex-col space-y-1.5 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{name}</h3>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{location}</p>
        <p className="text-sm">{specialty}</p>
        <div className="flex items-center justify-between pt-3">
          <p className="font-medium text-primary">€{hourlyRate}/hora</p>
          <Button size="sm">Ver perfil</Button>
        </div>
      </div>
    </div>
  );
}
