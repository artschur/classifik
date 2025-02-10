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

export default function SingleCompanionVerify({
  companion,
  onApprove,
  onReject,
}: {
  companion: RegisterCompanionFormValues & { id: number };
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{companion.name}</CardTitle>
          <Badge variant="outline">ID: {companion.id}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          {companion.shortDescription}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>
              {companion.age} anos, {companion.gender}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{companion.phoneNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>
              {companion.city}, {companion.state}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <span>{companion.languages.join(', ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <span>{companion.height}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <Weight className="w-4 h-4 text-muted-foreground" />
            <span>{companion.weight}kg</span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span>{companion.eye_color || 'N/A'}</span>
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
          <span>
            {companion.hair_color}, {companion.hair_length || 'N/A'}
          </span>
        </div>

        <p className="text-sm">{companion.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="w-1/2 bg-red-500 hover:bg-red-600 text-white"
          onClick={() => onReject(companion.id)}
        >
          <X className="w-4 h-4 mr-2" /> Rejeitar
        </Button>
        <Button
          className="w-1/2 bg-green-500 hover:bg-green-600 text-white"
          onClick={() => onApprove(companion.id)}
        >
          <Check className="w-4 h-4 mr-2" /> Aprovar
        </Button>
      </CardFooter>
    </Card>
  );
}
