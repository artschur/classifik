'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth, SignUpButton } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, Heart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CitySelectionModal } from '@/components/city-selection-modal';

interface LeadSelectionModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LeadSelectionModal({ open: controlledOpen, onOpenChange }: LeadSelectionModalProps = {}) {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [showCityModal, setShowCityModal] = React.useState(false);

  if (isSignedIn) {
    setInternalOpen(false);
    return
  }

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  React.useEffect(() => {

    if (controlledOpen === undefined) {
      const isLead = searchParams.get('lead') === 'true';

      if (isLead && !isSignedIn) {
        setInternalOpen(true);
      }
    }
  }, [searchParams, isSignedIn, controlledOpen]);

  const handleClose = () => {
    setOpen(false);
    // Remove lead param from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('lead');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleClientClick = () => {
    // Close lead selection modal and open city selection modal
    setOpen(false);
    setShowCityModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>

          {/* Header Section */}
          <div className="p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center mb-2">
                Bem-vindo ao OneSugar!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center text-lg">
                Escolha como deseja continuar:
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-4">
            {/* Sugar Option */}
            <SignUpButton
              mode="redirect"
              forceRedirectUrl="/companions/register"
              signInForceRedirectUrl="/companions/register"
            >
              <button
                className={cn(
                  "w-full group relative overflow-hidden rounded-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 dark:border-pink-800 p-6 text-left transition-all duration-300",
                  "hover:border-pink-400 hover:shadow-lg hover:scale-[1.02] dark:hover:border-pink-600"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 rounded-full bg-pink-500 p-3 text-white shadow-lg">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-pink-900 dark:text-pink-100 mb-1">
                      Sou Sugar
                    </h3>
                    <p className="text-sm text-pink-700 dark:text-pink-300 mb-3">
                      Divulgue seu perfil e aumente sua visibilidade
                    </p>
                    <ul className="text-xs text-pink-600 dark:text-pink-400 space-y-1">
                      <li>• Perfil verificado e destaque</li>
                      <li>• Gerencie clientes com facilidade</li>
                      <li>• Plataforma segura e discreta</li>
                    </ul>
                  </div>
                </div>
              </button>
            </SignUpButton>

            {/* Client Option - Opens City Selection Modal */}
            <button
              onClick={handleClientClick}
              className={cn(
                "w-full group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800 p-6 text-left transition-all duration-300",
                "hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] dark:hover:border-blue-600"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-full bg-blue-500 p-3 text-white shadow-lg">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                    Sou Cliente
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Encontre sugars verificadas em Portugal
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Acesso a perfis verificados</li>
                    <li>• Avaliações e comentários reais</li>
                    <li>• Total privacidade garantida</li>
                  </ul>
                </div>
              </div>
            </button>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Escolha seu perfil para continuar navegando no OneSugar
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* City Selection Modal - Opens after client selection */}
      <CitySelectionModal
        open={showCityModal}
        onOpenChange={setShowCityModal}
      />
    </>
  );
}
