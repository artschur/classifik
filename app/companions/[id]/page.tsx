import type React from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  MessageCircle,
  Phone,
  Check,
  Cake,
  MapPin,
  Ruler,
  Weight,
  Globe,
  Eye,
  User,
  Droplet,
  PenTool,
  Gem,
  Cigarette,
} from 'lucide-react';
import type { CompanionById } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageCarousel } from '@/components/imageCarousel';
import { getCompanionById, getReviewsByCompanionId } from '@/db/queries';
import { Review } from '@/db/schema';
import CompanionReviews from '@/components/companionReviews';
import { auth } from '@clerk/nextjs/server';
import { ImageGrid } from '@/components/imageGrid';

async function getCompanion(id: number): Promise<CompanionById> {
  return await getCompanionById(id);
}

async function getReviews(id: number): Promise<Review[]> {
  return await getReviewsByCompanionId(id);
}

function CarouselSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Skeleton className="w-full aspect-[16/9]" />
    </div>
  );
}

export default async function CompanionProfile({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const companion = await getCompanion(parseInt(id));
  const reviews = await getReviews(parseInt(id));
  const reviewCount = reviews.length;

  return (
    <div>
      <Card className="w-full max-w-5xl mx-auto overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<CarouselSkeleton />}>
            <ImageCarousel images={companion.images} />
          </Suspense>

          <CardContent className="mt-24">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:-mt-20">
              <div className="relative flex-shrink-0 w-32 h-32 overflow-hidden border-4 border-white rounded-full shadow-lg">
                <Image
                  src={companion.images[0] || '/placeholder.svg'}
                  alt={companion.name}
                  layout="fill"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-semibold sm:text-3xl">
                    {companion.name}
                  </h1>
                  {companion.verified && (
                    <Badge
                      variant="secondary"
                      className="text-green-800 bg-green-100"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Verificada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mt-1 text-sm sm:justify-start text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Online há 59 minutos</span>
                </div>
                <p className="mt-2 text-sm">{companion.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 px-4 py-6 mt-6 border-t border-b sm:px-8">
              <Stat label="Mídias" value={companion.images.length} />
              <Stat label="Preço" value={`R$ ${companion.price}/h`} />
              <Stat label="Reviews" value={reviewCount} />
            </div>

            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <Button className="w-full text-white bg-red-500 hover:bg-red-600">
                Seguir
              </Button>
              <Button variant="outline" className="w-full">
                Mais opções
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full mt-4 text-white bg-green-500 hover:bg-green-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversar online
            </Button>

            <div className="flex items-center gap-2 p-4 mt-6 rounded-lg bg-green-50">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">Perfil verificado</p>
            </div>

            <div>
              <ImageGrid images={companion.images} />
            </div>
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold">Sobre mim</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <CharacteristicItem
                  icon={<Cake />}
                  label="Idade"
                  value={`${companion.age} anos`}
                />
                <CharacteristicItem
                  icon={<MapPin />}
                  label="Cidade"
                  value={companion.languages.join(', ')}
                />
                <CharacteristicItem
                  icon={<Ruler />}
                  label="Altura"
                  value={`${companion.height} cm`}
                />
                <CharacteristicItem
                  icon={<Weight />}
                  label="Peso"
                  value={`${companion.weight} kg`}
                />
                <CharacteristicItem
                  icon={<Globe />}
                  label="Etnia"
                  value={companion.ethnicity}
                />
                <CharacteristicItem
                  icon={<Eye />}
                  label="Cor dos olhos"
                  value={companion.eyeColor || 'N/A'}
                />
                <CharacteristicItem
                  icon={<User />}
                  label="Cor do cabelo"
                  value={companion.hairColor}
                />
                <CharacteristicItem
                  icon={<Droplet />}
                  label="Silicone"
                  value={companion.silicone ? 'Sim' : 'Não'}
                />
                <CharacteristicItem
                  icon={<PenTool />}
                  label="Tatuagens"
                  value={companion.tattoos ? 'Sim' : 'Não'}
                />
                <CharacteristicItem
                  icon={<Gem />}
                  label="Piercings"
                  value={companion.piercings ? 'Sim' : 'Não'}
                />
                {companion.smoker !== undefined && (
                  <CharacteristicItem
                    icon={<Cigarette />}
                    label="Fumante"
                    value={companion.smoker ? 'Sim' : 'Não'}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
              <Button variant="outline" size="lg" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Conversar online
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Ver telefone
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      <CompanionReviews reviews={reviews} companionName={companion.name} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CharacteristicItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
