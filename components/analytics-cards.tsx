import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getSelfAnalytics,
  SelfAnalyticsResponse,
} from '@/db/queries/analytics';
import { IconBrandInstagram, IconBrandWhatsapp } from '@tabler/icons-react';

export async function AnalyticsCards({
  analytics,
}: {
  analytics: SelfAnalyticsResponse;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="">
        <CardHeader>
          <CardTitle>Visualizações de Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.perfil.total}</div>
          <p className="text-muted-foreground">
            {analytics.perfil.unique} visitantes únicos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex w-full gap-2 items-center">
            Cliques no WhatsApp <IconBrandWhatsapp />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.whatsapp.total}</div>
          <p className="text-muted-foreground">
            Taxa de conversão:{' '}
            {(analytics.whatsapp.conversionRate * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex w-full gap-2 items-center">
            Cliques no Instagram <IconBrandInstagram />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.instagram.total}</div>
          <p className="text-muted-foreground">
            Taxa de conversão:{' '}
            {(analytics.instagram.conversionRate * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
