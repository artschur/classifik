'use client';

import { GlobalPopup } from './global-popup';
import { useToast } from '@/hooks/use-toast';

interface GlobalPopupWrapperProps {
  isEnabled?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showCloseButton?: boolean;
  persistent?: boolean;
  storageKey?: string;
}

export function GlobalPopupWrapper({
  isEnabled = false,
  title = 'Important Notice',
  description = 'This is an important message for all users.',
  confirmText = 'Confirm',
  cancelText,
  showCloseButton = true,
  persistent = false,
  storageKey = 'global-popup-dismissed',
}: GlobalPopupWrapperProps) {
  const { toast } = useToast();

  const handleConfirm = () => {
    // Show success toast in bottom right
    toast({
      title: 'Oferta Aplicada!',
      description: 'Seus 2 meses grátis foram adicionados ao seu plano.',
      variant: 'success',
    });
    console.log('Global popup confirmed');
  };

  const handleCancel = () => {
    // Show info toast in bottom right
    toast({
      title: 'Oferta Recusada',
      description: 'Você pode aproveitar esta oferta a qualquer momento.',
      variant: 'default',
    });
    console.log('Global popup cancelled');
  };

  const handleClose = () => {
    // Add any custom logic for closing
    console.log('Global popup closed');
  };

  return (
    <GlobalPopup
      isEnabled={isEnabled}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      showCloseButton={showCloseButton}
      persistent={persistent}
      storageKey={storageKey}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  );
}
