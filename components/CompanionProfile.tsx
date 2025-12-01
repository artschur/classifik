import { getCompanionById } from '@/db/queries';
import type React from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  Share2,
  Heart,
  Star,
  CheckCircle,
  Info,
} from 'lucide-react';
import { ImageGrid } from '@/components/imageGrid';
import { getLastSignInByClerkId } from '@/db/queries/userActions';
import { WhatsAppButton } from './ui/whatsapp-button';

import {
  getImagesByCompanionId,
  getVerificationVideosByCompanionId,
} from '@/db/queries/images';
import { InstagramButton } from './ui/instagramButton';
import { getAudioUrlByCompanionId } from '@/db/queries/audio';
import AudioPlayer from '@/audio-player';
import { IconMicrophone } from '@tabler/icons-react';

async function LastSignIn({ clerkId }: { clerkId: string }) {
  const lastSignIn = await getLastSignInByClerkId(clerkId);
  return <span>{lastSignIn}</span>;
}

export async function CompanionProfile({
  id,
  reviewsRating,
}: {
  id: number;
  reviewsRating: number | 'Sem avaliações';
}) {
  const [companion, { images, total }, verificationVideo, audio] =
    await Promise.all([
      getCompanionById(id),
      getImagesByCompanionId(id, 3, 0),
      getVerificationVideosByCompanionId(id),
      getAudioUrlByCompanionId(id),
    ]);

  let sanitizedPhone = companion.phone.replace(/\D/g, '').replace(/^0+/, '');

  const initialMedia = images.map((img) => {
    if (
      img.publicUrl.match(/\.(mp4|webm|ogg|mov)$/i) &&
      !img.isVerificationVideo
    ) {
      return {
        type: 'video' as const,
        publicUrl: img.publicUrl,
      };
    }
    return img.publicUrl;
  });
  return (
    <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{companion.name}</h1>
        <div className="flex items-center mt-2 space-x-4">
          {companion.verified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" /> Verificada
            </Badge>
          )}
          <div className="flex items-center text-yellow-400">
            <Star className="w-5 h-5 mr-1" />
            <span className="font-semibold">{reviewsRating}</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <Suspense fallback={<Skeleton className="h-4 w-24" />}>
              <LastSignIn clerkId={companion.auth_id} />
            </Suspense>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ImageGrid
            initialImages={initialMedia}
            companionId={id}
            totalImages={total}
          />
          <Card className="mt-8">
            <CardContent className="p-6">
              {audio && (
                <div className="flex flex-col w-full gap-4 pb-4">
                  <h2 className="text-xl">
                    <IconMicrophone className="inline-block mr-2" />
                    Ouça minha voz
                  </h2>
                  <AudioPlayer songUrl={audio.publicUrl} />
                </div>
              )}
              <h2 className="text-2xl font-semibold mb-4 max-">
                Sobre {companion.name}
              </h2>
              <p className="text-muted-foreground mb-6 whitespace-normal truncate break-words overflow-wrap-anywhere">
                {companion.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
                <CharacteristicItem
                  label="Idade"
                  value={`${companion.age} anos`}
                />
                <CharacteristicItem
                  label="Altura"
                  value={`${companion.height} cm`}
                />
                <CharacteristicItem
                  label="Peso"
                  value={`${companion.weight} kg`}
                />
                <CharacteristicItem label="Etnia" value={companion.ethnicity} />
                <CharacteristicItem
                  label="Cor dos olhos"
                  value={companion.eyeColor || 'N/A'}
                />
                <CharacteristicItem
                  label="Cor do cabelo"
                  value={companion.hairColor}
                />
                <CharacteristicItem
                  label="Silicone"
                  value={companion.silicone ? 'Sim' : 'Não'}
                />
                <CharacteristicItem
                  label="Tatuagens"
                  value={companion.tattoos ? 'Sim' : 'Não'}
                />
                <CharacteristicItem
                  label="Piercings"
                  value={companion.piercings ? 'Sim' : 'Não'}
                />
                {companion.smoker !== undefined && (
                  <CharacteristicItem
                    label="Fumante"
                    value={companion.smoker ? 'Sim' : 'Não'}
                  />
                )}
              </div>
            </CardContent>
          </Card>
          {/*<Card className="w-full shadow-md mt-8">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">
                  Vídeo de Verificação
                </CardTitle>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  <CheckCircle className="w-4 h-4 mr-1" /> Verificado
                </Badge>
              </div>
              <CardDescription className="text-base mt-2">
                Este vídeo serve para garantir a autenticidade do perfil e a
                segurança de nossos clientes.
              </CardDescription>
            </CardHeader>

            {/*<CardContent className="space-y-6">
              <div className="flex justify-center">
                {verificationVideo[0] && (
                  <video
                    controls
                    className="w-full max-h-[400px] rounded-lg border shadow-sm object-contain"
                    src={verificationVideo[0].publicUrl}
                  />
                )}
              </div>
              <div className="bg-stone-700/20 shadow-md p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Detalhes do vídeo</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data de envio</p>
                    <p>
                      {verificationVideo[0] &&
                        new Date(
                          verificationVideo[0].createdAt
                        ).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p>Verificado pela equipe onesugar</p>
                  </div>
                </div>
              </div>
            </CardContent>*/}
          {/*</Card>*/}
        </div>

        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6 gap-2 flex flex-col">
              <div className="break-words overflow-wrap-anywhere whitespace-normal">
                {companion.shortDescription}
              </div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-2xl font-bold">
                    € {companion.price}
                  </span>
                  <span className="text-muted-foreground">/hora</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="icon" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <WhatsAppButton
                phone={sanitizedPhone}
                companionId={id}
                className="w-full"
              />
              {
                companion.instagramHandle && (
                  <InstagramButton
                    instagramHandle={companion.instagramHandle}
                    className="w-full"
                    companionId={id}
                  />)}

              <div className="mt-6 text-sm text-muted-foreground">
                <p>Idiomas: {companion.languages.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CompanionSkeleton() {
  return (
    <div className="max-w-7xl p-5">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="flex items-center mt-2 space-x-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <span className="text-muted-foreground">·</span>
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-8">
            <div className="col-span-3 row-span-2">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            </div>
            <div className="col-span-1">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            </div>
            <div className="col-span-1">
              <Skeleton className="aspect-[4/4] w-full rounded-xl" />
            </div>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <Skeleton className="h-7 w-48 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Skeleton className="h-7 w-32" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>

              <Skeleton className="h-10 w-full mb-3" />
              <Skeleton className="h-10 w-full" />

              <div className="mt-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CharacteristicItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
