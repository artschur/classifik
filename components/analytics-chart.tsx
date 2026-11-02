'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelfAnalyticsResponse } from '@/db/queries/analytics';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocale } from '@/components/locale-provider';

const TEXT = {
  pt: {
    titulo: 'Visualizações Diárias',
    serie: 'Visualizações',
    semDados: 'Sem dados para este período',
  },
  en: {
    titulo: 'Daily views',
    serie: 'Views',
    semDados: 'No data for this period',
  },
} as const;

export function AnalyticsChart({
  analytics,
}: {
  analytics: SelfAnalyticsResponse;
}) {
  const locale = useLocale();
  const t = TEXT[locale];
  // Em português mantém-se o formato de sempre.
  const dateLocale = locale === 'en' ? 'en-GB' : 'pt-BR';
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {analytics?.dailyViews?.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={analytics.dailyViews}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString(dateLocale, {
                    day: '2-digit',
                    month: '2-digit',
                  })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) =>
                  new Date(date).toLocaleDateString(dateLocale)
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ef4770"
                name={t.serie}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="h-full flex items-center justify-center text-muted-foreground">
            {t.semDados}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
