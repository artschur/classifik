import Image from 'next/image';
import Link from 'next/link';

interface CityCardProps {
  name: string;
  count: number;
  imageUrl: string;
}

export function CityCard({ name, count, imageUrl }: CityCardProps) {
  return (
    <Link
      href="#"
      className="group relative overflow-hidden rounded-lg border bg-background"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imageUrl || '/placeholder.svg'}
          width={500}
          height={300}
          alt={`Enfermeiros em ${name}`}
          className="h-full w-full object-cover transition-all group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <p className="text-sm text-white/80">Mais de {count} enfermeiros</p>
        </div>
      </div>
    </Link>
  );
}
