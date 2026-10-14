import Script from 'next/script';
import {
  Calculator,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Lightbulb,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { LocaleLink } from '@/components/locale-link';
import { absoluteUrl } from '@/lib/i18n';
import { LeadCapture } from './lead-capture';
import { SectionTitle } from './ui';

/**
 * Calculadora de ganhos em inglês (/en/quanto-ganha-acompanhante).
 * O componente da calculadora e o formulário são os mesmos da versão
 * portuguesa; só o texto desta página vive aqui.
 */

const L = 'en' as const;

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/', L) },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'How much do escorts earn',
      item: absoluteUrl('/quanto-ganha-acompanhante', L),
    },
  ],
};

const faqs = [
  {
    q: 'How much does an escort earn in Portugal?',
    a: 'There is no single figure: income depends on what you charge per meeting, how many meetings you take and how many days a week you work. On OneSugar, hourly rates typically range from €150 to €1,500, depending on the district, experience and positioning of each advertiser. The calculator on this page lets you try scenarios with your own numbers.',
  },
  {
    q: 'Does OneSugar take a commission on meetings?',
    a: 'No. 100% of the amount agreed for each meeting goes to the companion. OneSugar does not handle payments or keep any percentage. The platform only charges for optional featured plans, for advertisers who want more visibility in their district.',
  },
  {
    q: 'Do I have to pay to create my listing?',
    a: 'No. Creating your profile and publishing your listing is free, with up to 10 photos or videos. Paid plans (Classic, Plus and VIP) are optional and give you a more prominent position in the listings and in the district carousel.',
  },
  {
    q: 'What affects how much I can charge?',
    a: 'The biggest factors are the district you work in (demand in Lisbon and Porto is higher than in inland districts), the quality and freshness of your photos, how complete your profile is, how quickly you reply to messages and the reviews you receive. Verified, complete profiles tend to sustain higher rates.',
  },
  {
    q: 'Is the estimate a guaranteed income?',
    a: 'No. The calculator is a mathematical projection of the numbers you enter and is not a promise or guarantee of earnings. Real income varies with demand, season, availability and competition in your district.',
  },
  {
    q: 'Do I have to declare this income?',
    a: 'Income from self employment is subject to the tax rules in force in Portugal. OneSugar does not give tax advice, so we recommend speaking to a certified accountant about how the rules apply to you.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'en',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const strong = 'text-foreground font-medium';

export function GanhosEn() {
  return (
    <>
      <Script
        id="schema-breadcrumb-calc"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="schema-faq-calc"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <LocaleLink locale={L} href="/" className="hover:text-foreground transition-colors">
            Home
          </LocaleLink>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">How much do escorts earn</span>
        </nav>

        {/* HERO + CALCULATOR */}
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12 items-start">
          <div className="mb-10 lg:mb-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              How much does an <span className="text-rose-500">escort</span> earn in Portugal?
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
              It depends on what you charge, how many meetings you take and how
              many days a week you work. Use the calculator to try your own
              scenario, and remember: on OneSugar,{' '}
              <strong className={strong}>you keep 100% of every meeting</strong>.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-8 max-w-lg">
              {[
                { value: '€0', label: 'to create your listing' },
                { value: '100%', label: 'of the fee is yours' },
                { value: '18', label: 'districts covered' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <LeadCapture />
          </div>
        </div>

        <hr className="border-border my-14" />

        {/* HOW THE ESTIMATE WORKS */}
        <section>
          <SectionTitle id="como-funciona" title="How the estimate works" icon={<Calculator className="h-4 w-4" />} />
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            The calculator uses a simple, transparent formula with no hidden
            deductions, because OneSugar does not keep any percentage:
          </p>

          <div className="rounded-xl border border-border bg-card px-5 py-4 mb-6 overflow-x-auto">
            <code className="text-sm text-foreground whitespace-nowrap">
              price per meeting × meetings per day × days per week × 4 weeks
            </code>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <TrendingUp className="h-4 w-4" />,
                title: 'Price per meeting',
                desc: 'What you charge for each meeting. It has the biggest impact on the result.',
              },
              {
                icon: <Clock className="h-4 w-4" />,
                title: 'Working pace',
                desc: 'How many meetings you accept per day and how many days you work. It sets the volume.',
              },
              {
                icon: <ShieldCheck className="h-4 w-4" />,
                title: 'No commission',
                desc: 'The platform keeps nothing from the agreed fee. What you charge is what you get.',
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
                  {c.icon}
                </div>
                <p className="font-semibold text-sm text-foreground mb-1">{c.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6 max-w-2xl">
            The result assumes a full month of work at the pace you entered. In
            practice few weeks are the same, so it is worth running a more
            conservative scenario too, with fewer days, to see a realistic range.
          </p>
        </section>

        <hr className="border-border my-14" />

        {/* MARKET */}
        <section>
          <SectionTitle id="mercado-portugal" title="The market in Portugal" icon={<MapPin className="h-4 w-4" />} />
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            <p>
              Portugal is not one single market. Demand is concentrated in the
              big cities and in the areas with the most tourism and business
              travel, which shows directly in the rates charged and in how often
              clients get in touch.
            </p>
            <p>
              <strong className={strong}>Lisbon and Porto</strong> have the
              highest demand all year round, with hourly rates usually above the
              national average. <strong className={strong}>Faro and the Algarve</strong>{' '}
              are strongly seasonal, with clear peaks in summer. Inland districts
              such as <strong className={strong}>Guarda, Bragança or Portalegre</strong>{' '}
              have less volume but also far less competition, which can pay off
              for advertisers with regular clients.
            </p>
            <p>
              Seasonality matters more than most people expect. Besides the
              Algarve summer, school holidays, long weekends and big events in
              Lisbon and Porto can change the number of contacts a lot from one
              week to the next.
            </p>
            <p>
              Finally, verification is a competitive edge. In a market where
              fake profiles are a common complaint, a profile with a confirmed
              identity starts from a stronger position of trust, and that shows
              in what clients are willing to pay.
            </p>
          </div>
        </section>

        <hr className="border-border my-14" />

        {/* TIPS */}
        <section>
          <SectionTitle id="dicas" title="How to earn more" icon={<Lightbulb className="h-4 w-4" />} />
          <div className="space-y-3 max-w-2xl">
            {[
              {
                title: 'Fill in your whole profile',
                desc: 'Profiles with every feature filled in show up in more search filters. Every empty field is a search you will not appear in.',
              },
              {
                title: 'Invest in your photos',
                desc: 'Good lighting (natural light if possible), a clean background and a variety of poses. Photos are the first, and often the only, deciding factor.',
              },
              {
                title: 'Write a short description that stands out',
                desc: 'It is the text shown in the listing before anyone opens your profile. Use it to say what makes you different, not to repeat the obvious.',
              },
              {
                title: 'Reply quickly',
                desc: 'Response time is often what decides between you and another profile. Unanswered messages are lost income.',
              },
              {
                title: 'Set your price on purpose',
                desc: 'A price that is too low does not necessarily bring more clients, and it undervalues your positioning. Look at the rates in your district and adjust carefully.',
              },
              {
                title: 'Consider a featured plan when it makes sense',
                desc: 'If your profile is complete and your photos are good but you get few contacts, the issue is usually visibility. That is when a paid plan pays for itself.',
              },
              {
                title: 'Add a few lines in English',
                desc: 'Many visitors to Portugal search in English. A short English paragraph in your description and English listed among your languages help you reach them.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-border my-14" />

        {/* FAQ */}
        <section>
          <SectionTitle id="faq" title="Frequently asked questions about earnings" icon={<HelpCircle className="h-4 w-4" />} />
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border max-w-2xl">
            {faqs.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer select-none text-sm font-medium text-foreground hover:bg-muted/30 transition-colors list-none">
                  {item.q}
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Questions about signing up, photos or verification?{' '}
            <LocaleLink locale={L} href="/ajuda-anunciantes" className="text-rose-500 hover:underline font-medium">
              Read the full guide for advertisers
            </LocaleLink>
            .
          </p>
        </section>

        {/* FINAL CTA */}
        <section className="mt-14 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-6 py-10 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to start?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Creating your listing is free and takes a few minutes. You only pay
            if you want more visibility in your district.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <LocaleLink
              locale={L}
              href="/companions/register"
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Create my free listing
            </LocaleLink>
            <LocaleLink
              locale={L}
              href="/checkout"
              className="w-full sm:w-auto border border-border hover:bg-muted text-foreground font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              See plans (in Portuguese)
            </LocaleLink>
          </div>
        </section>
      </div>
    </>
  );
}
