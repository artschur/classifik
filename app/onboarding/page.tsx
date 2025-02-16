'use client';

import { Spotlight } from '@/components/spotlightNew';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { handleOnboard } from './actions';

export default function OnboardPage() {
  return (
    <section className="w-full min-h-screen flex items-center justify-center p-12">
      <Spotlight />
      <div className="max-w-7xl flex items-center justify-center h-full flex-col w-full pt-20 md:pt-0">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
          Bem vindo ao <br /> OneSugar
        </h1>
        <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
          as mais doces acompanhantes de portugal, em um só lugar.
        </p>
        <div className="flex gap-8 items-center justify-center flex-col mt-12">
          <div className="flex gap-8">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  onClick={() => handleOnboard({ isCompanion: true })}
                  variant="outline"
                  className="px-6 py-3 bg-primary/80 rounded-lg  hover:bg-white/20 transition-all"
                >
                  Sou Acompanhante
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Divulgar na OneSugar.
                  </h4>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Aumente sua visibilidade</li>
                    <li>Gerencie seu perfil facilmente</li>
                    <li>Adquira novos clientes em uma plataforma crescente.</li>
                  </ul>
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  onClick={() => handleOnboard({ isCompanion: false })}
                  variant="outline"
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                >
                  Sou Cliente
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Ser um cliente OneSugar.
                  </h4>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Tenha acesso a mais perfis.</li>
                    <li>Leie e deixe reviews</li>
                    <li>Anonimidade em primeiro lugar</li>
                    <li>Segurança em primeiro lugar</li>
                  </ul>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <p className="text-neutral-300 text-sm">
            Crie sua conta gratuitamente.
          </p>
        </div>
      </div>
    </section>
  );
}
