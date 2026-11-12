import { Phone } from 'lucide-react';

/** O telefone junto ao nome, como no cartão dos Registos (só para admins). */
export function PhoneTag({ phone }: { phone: string | null | undefined }) {
  if (!phone) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Phone className="h-3.5 w-3.5" />
      {phone}
    </span>
  );
}
