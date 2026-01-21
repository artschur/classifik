"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AgeVerificationModalProps {
  onVerified?: () => void;
}

export function AgeVerificationModal({ onVerified }: AgeVerificationModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVerified = localStorage.getItem("age-verified");
    if (!hasVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("age-verified", "true");
    setIsOpen(false);
    // Trigger the next step (lead selection modal)
    if (onVerified) {
      onVerified();
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verificação de Idade</AlertDialogTitle>
          <AlertDialogDescription>
            Você precisa ter 18 anos ou mais para acessar este site. Ao clicar em
            confirmar, você declara que tem 18 anos ou mais.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <a href="https://www.google.com">Sair</a>
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirmar, tenho 18 anos ou mais
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
