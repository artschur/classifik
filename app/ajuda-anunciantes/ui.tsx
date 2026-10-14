import { CheckCircle2, XCircle } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

/*
 * Blocos visuais do guia para anunciantes, partilhados pela versão
 * portuguesa (page.tsx) e pela inglesa (page-en.tsx).
 */

export function SectionTitle({ id, eyebrow, title, icon }: { id: string; eyebrow: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-primary">{icon}</span>
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-0.5">{eyebrow}</p>
        <h2 id={id} className="text-xl font-bold text-foreground scroll-mt-24">{title}</h2>
      </div>
    </div>
  );
}

export function Steps({ steps }: { steps: { title: string; desc: React.ReactNode }[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 z-10">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px bg-border flex-1 my-1" style={{ minHeight: '20px' }} />
            )}
          </div>
          <div className={`pb-5 ${i < steps.length - 1 ? '' : ''}`}>
            <p className="font-semibold text-sm text-foreground leading-7">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FieldList({
  fields,
  locale = 'pt',
}: {
  fields: { name: string; rule: string; req: boolean }[];
  locale?: Locale;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {fields.map((f) => (
        <div key={f.name} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
            {f.rule !== '—' && <p className="text-xs text-muted-foreground mt-0.5">{f.rule}</p>}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${f.req ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {locale === 'en' ? (f.req ? 'required' : 'optional') : f.req ? 'obrig.' : 'opc.'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CheckList({ items, ok }: { items: string[]; ok: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          {ok
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          }
          <span className="text-muted-foreground leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-foreground">
      <span className="text-amber-500 mt-0.5 flex-shrink-0">💡</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

export function Divider() {
  return <hr className="border-border my-10" />;
}
