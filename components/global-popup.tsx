'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface GlobalPopupProps {
  isEnabled: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showCloseButton?: boolean;
  persistent?: boolean; // If true, popup will show every time, if false, it will remember dismissal
  storageKey?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function GlobalPopup({
  isEnabled = false,
  title = 'Important Notice',
  description = 'This is an important message for all users.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCloseButton = true,
  persistent = false,
  storageKey = 'global-popup-dismissed',
  onConfirm,
  onCancel,
  onClose,
}: GlobalPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Check if popup should be shown
    const shouldShow = persistent || !localStorage.getItem(storageKey);

    if (shouldShow) {
      setIsOpen(true);
    }
  }, [isEnabled, persistent, storageKey]);

  const handleConfirm = () => {
    if (!persistent) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
    onConfirm?.();
  };

  const handleCancel = () => {
    if (!persistent) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
    onCancel?.();
  };

  const handleClose = () => {
    if (!persistent) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
    onClose?.();
  };

  if (!isEnabled) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md">
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancelText && (
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
