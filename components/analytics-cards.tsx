import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getSelfAnalytics,
  SelfAnalyticsResponse,
} from '@/db/queries/analytics';
import { IconBrandInstagram, IconBrandWhatsapp } from '@tabler/icons-react';
import { getLocale } from '@/lib/locale.server';

const TEXT = {
  pt: {
    visualizacoes: 'Visualizações de Perfil',
    unicos: 'visitantes únicos',
    whatsapp: 'Cliques no WhatsApp',
    instagram: 'Cliques no Instagram',
    conversao: 'Taxa de conversão:',
  },
  en: {
    visualizacoes: 'Profile views',
    unicos: 'unique visitors',
    whatsapp: 'WhatsApp clicks',
    instagram: 'Instagram clicks',
    conversao: 'Conversion rate:',
  },
} as const;

export async function AnalyticsCards({
  analytics,
}: {
  analytics: SelfAnalyticsResponse;
}) {
  const t = TEXT[await getLocale()];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="">
        <CardHeader>
          <CardTitle>{t.visualizacoes}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.perfil.total}</div>
          <p className="text-muted-foreground">
            {analytics.perfil.unique} {t.unicos}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex w-full gap-2 items-center">
            {t.whatsapp} <IconBrandWhatsapp />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.whatsapp.total}</div>
          <p className="text-muted-foreground">
            {t.conversao}{' '}
            {(analytics.whatsapp.conversionRate * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex w-full gap-2 items-center">
            {t.instagram} <IconBrandInstagram />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.instagram.total}</div>
          <p className="text-muted-foreground">
            {t.conversao}{' '}
            {(analytics.instagram.conversionRate * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
