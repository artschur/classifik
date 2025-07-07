'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function BlockedProfileMessage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <Card className="text-center">
        <CardHeader className="pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Acesso Bloqueado
          </CardTitle>
          <CardDescription className="text-lg">
            Este perfil não está disponível para você.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-muted-foreground">
            <p className="mb-4">
              A acompanhante bloqueou seu acesso a este perfil. Isso pode
              acontecer por diversos motivos, como:
            </p>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Comportamento inadequado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Violar as políticas do site</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Preferência pessoal da acompanhante</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.push('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Se você acredita que isso foi um erro, entre em contato com nosso
              suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
