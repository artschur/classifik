'use client';

import {
  Check,
  X,
  User,
  Phone,
  MapPin,
  Languages,
  Ruler,
  Weight,
  Eye,
  Scissors,
} from 'lucide-react';
import type { RegisterCompanionFormValues } from './formCompanionRegister';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { approveCompanion, rejectCompanion } from '@/db/queries/companions';

export default function SingleCompanionVerify({
  companion,
  onActionComplete,
}: {
  companion: RegisterCompanionFormValues & { id: number; cityName: string };
  onActionComplete: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await approveCompanion(companion.id);
        toast({
          title: 'Companion Approved',
          description: `${companion.name} has been successfully approved.`,
          variant: 'success',
        });
        onActionComplete();
      } catch (e) {
        setError('Failed to approve companion. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to approve companion. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      try {
        await rejectCompanion(companion.id);
        toast({
          title: 'Companion Rejected',
          description: `${companion.name} has been rejected.`,
          variant: 'success',
        });
        onActionComplete();
      } catch (e) {
        setError('Failed to reject companion. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to reject companion. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
            {companion.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          {companion.shortDescription}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {companion.age} anos, {companion.gender}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.phoneNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {companion.cityName}, {companion.state}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.languages.join(', ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.height}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <Weight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.weight}kg</span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.eye_color || 'N/A'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={companion.silicone ? 'default' : 'secondary'}>
            Silicone
          </Badge>
          <Badge variant={companion.tattoos ? 'default' : 'secondary'}>
            Tatuagens
          </Badge>
          <Badge variant={companion.piercings ? 'default' : 'secondary'}>
            Piercings
          </Badge>
          <Badge variant={companion.smoker ? 'default' : 'secondary'}>
            Fumante
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Scissors className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {companion.hair_color}, {companion.hair_length || 'N/A'}
          </span>
        </div>

        <p className="text-sm">{companion.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <Button
            variant="outline"
            className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
            onClick={handleReject}
            disabled={isPending}
          >
            <X className="w-4 h-4 mr-2" /> Rejeitar
          </Button>
          <Button
            className="w-full sm:w-1/2 bg-green-500 hover:bg-green-600 text-white"
            onClick={handleApprove}
            disabled={isPending}
          >
            <Check className="w-4 h-4 mr-2" /> Aprovar
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {isPending && <p className="text-gray-500 text-sm">Processing...</p>}
      </CardFooter>
    </Card>
  );
}
