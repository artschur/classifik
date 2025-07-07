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

interface BlockManagementFormProps {
  companionId: number;
}

export function BlockManagementForm({ companionId }: BlockManagementFormProps) {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o ID do usuário.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent blocking yourself
    if (user && userId.trim() === user.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode bloquear a si mesmo.',
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
          title: 'Sucesso',
          description: 'Usuário bloqueado com sucesso.',
        });
        setUserId('');
        setReason('');
        // Refresh the page to show updated list
        window.location.reload();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao bloquear usuário.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao bloquear usuário. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">ID do Usuário (Clerk ID)</Label>
        <Input
          id="userId"
          type="text"
          placeholder="user_2wYHzDclTd4kDn7lCymwRzxsUli"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Digite o ID do usuário do Clerk que você deseja bloquear.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo (Opcional)</Label>
        <Textarea
          id="reason"
          placeholder="Motivo pelo qual você está bloqueando este usuário..."
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
            Bloqueando...
          </>
        ) : (
          <>
            <UserX className="w-4 h-4 mr-2" />
            Bloquear Usuário
          </>
        )}
      </Button>
    </form>
  );
}
