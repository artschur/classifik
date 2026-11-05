'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserX } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { blockUserAction } from '@/app/actions/block-actions';
import { useLocale } from '@/components/locale-provider';

const TEXT = {
  pt: {
    erro: 'Erro',
    sucesso: 'Sucesso',
    semId: 'Por favor, insira o ID do usuário.',
    proprio: 'Você não pode bloquear a si mesmo.',
    bloqueado: 'Usuário bloqueado com sucesso.',
    erroBloquear: 'Erro ao bloquear usuário.',
    erroTente: 'Erro ao bloquear usuário. Tente novamente.',
    idLabel: 'ID do Usuário (Clerk ID)',
    idAjuda: 'Digite o ID do usuário do Clerk que você deseja bloquear.',
    motivoLabel: 'Motivo (Opcional)',
    motivoPlaceholder: 'Motivo pelo qual você está bloqueando este usuário...',
    aBloquear: 'Bloqueando...',
    bloquear: 'Bloquear Usuário',
  },
  en: {
    erro: 'Error',
    sucesso: 'Success',
    semId: 'Please enter the user ID.',
    proprio: 'You cannot block yourself.',
    bloqueado: 'User blocked.',
    erroBloquear: 'Could not block the user.',
    erroTente: 'Could not block the user. Please try again.',
    idLabel: 'User ID (Clerk ID)',
    idAjuda: 'Enter the Clerk user ID of the person you want to block.',
    motivoLabel: 'Reason (optional)',
    motivoPlaceholder: 'Why you are blocking this user...',
    aBloquear: 'Blocking...',
    bloquear: 'Block user',
  },
} as const;

interface BlockManagementFormProps {
  companionId: number;
}

export function BlockManagementForm({ companionId }: BlockManagementFormProps) {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const locale = useLocale();
  const t = TEXT[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      toast({
        title: t.erro,
        description: t.semId,
        variant: 'destructive',
      });
      return;
    }

    // Prevent blocking yourself
    if (user && userId.trim() === user.id) {
      toast({
        title: t.erro,
        description: t.proprio,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await blockUserAction(
        companionId,
        userId.trim(),
        reason.trim() || undefined
      );

      if (result.success) {
        toast({
          title: t.sucesso,
          description: t.bloqueado,
        });
        setUserId('');
        setReason('');
        // Refresh the page to show updated list
        window.location.reload();
      } else {
        toast({
          title: t.erro,
          description: result.error || t.erroBloquear,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t.erro,
        description: t.erroTente,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">{t.idLabel}</Label>
        <Input
          id="userId"
          type="text"
          placeholder="user_2wYHzDclTd4kDn7lCymwRzxsUli"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          {t.idAjuda}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">{t.motivoLabel}</Label>
        <Textarea
          id="reason"
          placeholder={t.motivoPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !userId.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Shield className="w-4 h-4 mr-2 animate-spin" />
            {t.aBloquear}
          </>
        ) : (
          <>
            <UserX className="w-4 h-4 mr-2" />
            {t.bloquear}
          </>
        )}
      </Button>
    </form>
  );
}
