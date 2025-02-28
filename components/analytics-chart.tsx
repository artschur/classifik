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

export function AnalyticsChart({
  analytics,
}: {
  analytics: SelfAnalyticsResponse;
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Visualizações Diárias</CardTitle>
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
                  new Date(date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) =>
                  new Date(date).toLocaleDateString('pt-BR')
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ef4770"
                name="Visualizações"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="h-full flex items-center justify-center text-muted-foreground">
            Sem dados para este período
          </p>
        )}
      </CardContent>
    </Card>
  );
}
