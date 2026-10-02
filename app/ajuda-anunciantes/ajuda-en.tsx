import Script from 'next/script';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Camera,
  FileVideo,
  ShieldCheck,
  ThumbsUp,
  Lightbulb,
  HelpCircle,
  Headphones,
  RefreshCw,
} from 'lucide-react';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { LocaleLink } from '@/components/locale-link';
import { absoluteUrl } from '@/lib/i18n';
import { TocMobile, TocDesktop } from './toc';
import { SectionTitle, Steps, FieldList, CheckList, Callout, Divider } from './ui';

/**
 * Guia para anunciantes em inglês (/en/ajuda-anunciantes).
 *
 * As âncoras são as mesmas da versão portuguesa, porque o índice lateral
 * (toc.tsx) é partilhado. O formulário de registo continua em português,
 * por isso os nomes dos campos aparecem também em português entre
 * parênteses, para quem segue o guia os reconhecer no ecrã.
 */

const L = 'en' as const;
const PAGE = absoluteUrl('/ajuda-anunciantes', L);

const faq = [
  { q: 'How long until my profile goes live?', a: 'From a few minutes to a few hours, depending on how many requests the team has. During support hours (08:00 to 18:00, Lisbon time) it is usually quicker.' },
  { q: 'My verification video was rejected. What should I do?', a: 'Record it again following the instructions sent by email or WhatsApp. Make sure the date is readable, that you are holding the paper with "OneSugar" written on it and that your face and body are clearly visible.' },
  { q: 'Can I edit my listing after it is published?', a: 'Yes. You can edit any information, including text, photos, videos and price, at any time without creating a new profile.' },
  { q: 'How many photos can I have on my profile?', a: 'The free plan allows up to 10 photos and videos. Paid plans (Classic, Plus, VIP) raise the limit to 30.' },
  { q: 'My ID document is not being accepted. What should I do?', a: 'Accepted documents: passport, Portuguese Citizen Card or Brazilian RG, driving licence (or Brazilian CNH). The file must be JPG, PNG or PDF, no larger than 5 MB, readable, with no glare or cut off edges.' },
  { q: 'Is it free to sign up?', a: 'Yes, creating a profile on OneSugar is completely free. Paid plans are available if you want more visibility and more clients.', cta: true },
  { q: 'Does OneSugar share my data with third parties?', a: 'No. The video and document you send are used only to verify your identity and are never shared with third parties. See our Privacy Policy (in Portuguese) for details.' },
  { q: 'Can I have more than one profile with the same email?', a: 'No. Each account is tied to one email address: one email, one account. Creating multiple accounts can lead to permanent suspension.' },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/', L) },
    { '@type': 'ListItem', position: 2, name: 'Help for advertisers', item: PAGE },
  ],
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to publish your profile on OneSugar',
  inLanguage: 'en',
  description: 'Step by step guide to creating, verifying and publishing your advertiser profile on OneSugar.',
  step: [
    { '@type': 'HowToStep', name: 'Sign up', url: `${PAGE}#registo`, text: 'Go to onesugar.pt/companions/register, create an account with your email and a password, confirm your email and fill in the 4 step form.' },
    { '@type': 'HowToStep', name: 'Create your listing', url: `${PAGE}#criar-anuncio`, text: 'Complete the 4 step form: Details, Features, Location and Photos.' },
    { '@type': 'HowToStep', name: 'Upload your photos', url: `${PAGE}#fotografias`, text: 'Upload between 1 and 10 photos or videos (up to 30 on paid plans). Accepted formats: JPG, PNG, WebP, MP4.' },
    { '@type': 'HowToStep', name: 'Record the 360° verification video', url: `${PAGE}#video-verificacao`, text: 'Record a 10 to 15 second video holding a piece of paper with "OneSugar" and today\'s date, showing your face and body in good light. Maximum 50 MB.' },
    { '@type': 'HowToStep', name: 'Verification', url: `${PAGE}#verificacao`, text: 'Send the verification video and an ID document. The team checks that your face matches, that you are an adult and that the document is genuine.' },
    { '@type': 'HowToStep', name: 'Approval', url: `${PAGE}#aprovacao`, text: 'After the review, your profile is either approved (and goes live) or rejected (you receive an email with the reasons and can fix them and reactivate it).' },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'en',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

const strong = 'text-foreground font-medium';

export function AjudaAnunciantesEn() {
  return (
    <>
      <Script id="schema-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="schema-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <TocMobile />

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <LocaleLink locale={L} href="/" className="hover:text-foreground transition-colors">Home</LocaleLink>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Help for advertisers</span>
        </nav>

        <div className="md:grid md:grid-cols-[200px_1fr] md:gap-12">
          <TocDesktop />

          <main className="min-w-0">
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Guide for advertisers</h1>
              <p className="text-muted-foreground text-base max-w-lg">
                Everything you need to know to create, verify and publish your profile on OneSugar.
              </p>
              <p className="text-sm text-muted-foreground max-w-lg mt-3">
                The sign up form is in Portuguese for now, so this guide shows the Portuguese field names in brackets.
              </p>
            </div>

            {/* 1. SIGN UP */}
            <section>
              <SectionTitle id="registo" eyebrow="01" title="How to sign up" icon={<ShieldCheck className="h-4 w-4" />} />
              <Steps steps={[
                { title: 'Open the sign up page', desc: <span>Go to <strong className={strong}>onesugar.pt/companions/register</strong></span> },
                { title: 'Create an account', desc: 'If you do not have an account yet, click "Criar conta" (Create account). You sign up with an email and a password.' },
                { title: 'Confirm your email', desc: 'If asked, confirm your email address using the link sent to your inbox.' },
                { title: 'Fill in the profile form', desc: <span>Once you are logged in, you are taken to the profile form, which has <strong className={strong}>4 steps</strong>: Details, Features, Location and Photos.</span> },
                { title: 'Identity verification', desc: 'After you add your first photo, you are taken to identity verification (video and document). Phone verification is not required to sign up.' },
              ]} />
            </section>

            <Divider />

            {/* 2. CREATE LISTING */}
            <section>
              <SectionTitle id="criar-anuncio" eyebrow="02" title="How to create your listing" />
              <p className="text-sm text-muted-foreground mb-6">The form has 4 steps that must be completed in order. You can edit your listing at any time after submitting it.</p>

              <p className="text-sm font-semibold text-foreground mb-3">Step 1: Details (Informações)</p>
              <FieldList locale={L} fields={[
                { name: 'Stage name (Nome artístico)', rule: 'at least 2 characters', req: true },
                { name: 'Phone number (Telefone)', rule: 'at least 8 characters', req: true },
                { name: 'Short description (Descrição curta)', rule: 'up to 150 characters', req: true },
                { name: 'Full description (Descrição completa)', rule: '30 to 500 characters', req: true },
                { name: 'Price per hour (Preço por hora)', rule: 'number in €', req: true },
                { name: 'Age (Idade)', rule: '18 to 40+', req: true },
                { name: 'Gender (Género)', rule: 'Male / Female / Trans / Other', req: true },
                { name: 'Languages spoken (Línguas)', rule: 'at least 1', req: true },
                { name: 'Instagram', rule: '—', req: false },
                { name: 'Gender identity (Identidade de género)', rule: 'Cisgender / Transgender / Other', req: false },
              ]} />

              <p className="text-sm font-semibold text-foreground mt-6 mb-3">Step 2: Features (Características)</p>
              <FieldList locale={L} fields={[
                { name: 'Weight in kg (Peso)', rule: 'at least 30 kg', req: true },
                { name: 'Height in m (Altura)', rule: '1.30 m to 2.50 m', req: true },
                { name: 'Ethnicity (Etnia)', rule: 'White / Black / Latina / Asian', req: true },
                { name: 'Hair colour (Cor do cabelo)', rule: 'Blonde / Brown / Black / …', req: true },
                { name: 'Eye colour (Cor dos olhos)', rule: 'Blue / Green / Brown / Black', req: false },
                { name: 'Hair length (Tamanho do cabelo)', rule: 'Short / Medium / Long / Very long', req: false },
                { name: 'Shoe size, EU (Tamanho do pé)', rule: '—', req: false },
                { name: 'Silicone / Tattoos / Piercings / Smoker', rule: 'Yes / No', req: false },
              ]} />

              <p className="text-sm font-semibold text-foreground mt-6 mb-3">Step 3: Location (Localização)</p>
              <FieldList locale={L} fields={[
                { name: 'District (Distrito)', rule: 'chosen from the list', req: true },
                { name: 'Municipality (Concelho)', rule: 'free text', req: true },
                { name: 'Hotel visits (Atende em hotel)', rule: 'Yes / No', req: false },
                { name: 'Own place (Atende em local próprio)', rule: 'Yes / No', req: false },
              ]} />

              <p className="text-sm text-muted-foreground mt-6">
                <strong className={strong}>Step 4: Photos (Fotos)</strong>{' '}
                see the <a href="#fotografias" className="text-primary hover:underline">Photos</a> section.
              </p>
            </section>

            <Divider />

            {/* 3. PHOTOS */}
            <section>
              <SectionTitle id="fotografias" eyebrow="03" title="How to upload your photos" icon={<Camera className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-6">Photos are uploaded in Step 4 of the form, or from your profile editing area at any time.</p>

              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">1</p>
                  <p className="text-xs text-muted-foreground mt-1">photo needed to create your profile</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">10</p>
                  <p className="text-xs text-muted-foreground mt-1">photos or videos on the free plan</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">30</p>
                  <p className="text-xs text-muted-foreground mt-1">photos or videos on paid plans</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card px-4 py-4 mb-5 text-sm space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Formats and limits</p>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Accepted formats</span>
                  <span className="text-foreground font-medium">JPG, PNG, WebP, MP4</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Automatic compression</span>
                  <span className="text-foreground font-medium">up to 2 MB · max. 1920 px</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground">Short videos</span>
                  <span className="text-foreground font-medium">MP4 · max. 50 MB</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-foreground mb-3">Why photos get rejected</p>
              <CheckList ok={false} items={[
                'Visible watermark',
                'Visible contact details (phone number, email, social media)',
                'Low quality or blurry image',
                'Anyone under 18',
                'The person in the photo does not match the profile',
              ]} />
            </section>

            <Divider />

            {/* 4. VIDEO */}
            <section>
              <SectionTitle id="video-verificacao" eyebrow="04" title="360° verification video" icon={<FileVideo className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-6">
                Requested after you add your first photo. You will be taken to{' '}
                <strong className={strong}>onesugar.pt/companions/verification</strong>.
              </p>

              <p className="text-sm font-semibold text-foreground mb-4">What to record</p>
              <Steps steps={[
                { title: 'Prepare a piece of paper', desc: <span>Write <strong className={strong}>&quot;OneSugar&quot;</strong> and <strong className={strong}>today&apos;s date</strong> by hand, clearly.</span> },
                { title: 'Record the video', desc: 'Hold the paper and record a video that clearly shows your face and your full body, in good light. The video should last 10 to 15 seconds.' },
                { title: 'Upload it', desc: 'Upload it on the platform. Maximum size: 50 MB. Any video format is accepted (MP4, MOV and so on).' },
              ]} />

              <div className="mt-5 space-y-3">
                <Callout>
                  <strong>Video larger than 50 MB?</strong> Compress it before uploading:{' '}
                  iPhone: <strong>Video Compress</strong> · Android: <strong>Video Compressor</strong> · Online: <strong>clideo.com</strong>
                </Callout>

                <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  <strong className="text-foreground">Why it matters:</strong> the video is compared with your profile photos to confirm you are the same person and that you are an adult. It also prevents fake profiles and fraud on the platform.
                </div>
              </div>
            </section>

            <Divider />

            {/* 5. VERIFICATION */}
            <section>
              <SectionTitle id="verificacao" eyebrow="05" title="How profile verification works" icon={<ShieldCheck className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-5">Verification has two required steps, done in this order:</p>

              <Steps steps={[
                { title: '360° verification video', desc: 'Described in the previous section.' },
                {
                  title: 'ID document',
                  desc: (
                    <span>
                      Passport, Portuguese Citizen Card or Brazilian RG, or driving licence (or Brazilian CNH).
                      Formats: JPG, PNG or PDF · Maximum size: <strong className={strong}>5 MB</strong>.
                    </span>
                  ),
                },
              ]} />

              <p className="text-sm text-muted-foreground mt-4 mb-5">
                Once you have sent both, your profile shows as <strong className={strong}>&quot;Pending approval&quot;</strong> while the team reviews it manually.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">What the team checks</p>
                  <CheckList ok={true} items={[
                    'Face match (selfie with the document)',
                    'Date visible and readable on the paper',
                    'ID document is readable',
                    'You are an adult (18 or over)',
                    'The age on your listing matches your real age and your document',
                    'You are a real person',
                  ]} />
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 flex items-center gap-3 h-fit">
                  <Clock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Average response time</p>
                    <p className="text-lg font-bold text-foreground">A few minutes</p>
                    <p className="text-xs text-muted-foreground">during support hours</p>
                  </div>
                </div>
              </div>
            </section>

            <Divider />

            {/* 6. APPROVAL */}
            <section>
              <SectionTitle id="aprovacao" eyebrow="06" title="How profile approval works" icon={<ThumbsUp className="h-4 w-4" />} />

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-foreground">Profile approved</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Your profile goes live on the platform and appears in the listings. You will get an email notification.</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <p className="text-sm font-semibold text-foreground">Profile rejected</p>
                  </div>
                  <p className="text-sm text-muted-foreground">You will get an email with the reasons. You can fix them and reactivate your profile, which is not deleted.</p>
                </div>
              </div>

              <p className="text-sm font-semibold text-foreground mb-3">Common reasons for rejection</p>
              <CheckList ok={false} items={[
                'Incomplete information: name, location, languages or description missing',
                'Poor quality or unclear photos',
                'Photos with watermarks, overlaid text or visible contact details',
                'Personal information that is wrong or cannot be confirmed',
                'Age on the listing does not match your real age or the verification',
                'Explicit content or content that breaks the community rules',
                'A careless profile with too little information',
              ]} />
            </section>

            <Divider />

            {/* 7. EDITS */}
            <section>
              <SectionTitle id="edicoes-perfil" eyebrow="07" title="Editing your profile and re-verification" icon={<RefreshCw className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-6">
                Whenever you edit your profile, your listing goes back to review before it is published again.
              </p>
              <Callout>
                <strong className="font-medium">Your listing is temporarily hidden during the review.</strong> While the team checks your changes, your profile does not appear in search. Once approved, it becomes visible again automatically.
              </Callout>
              <p className="text-sm text-muted-foreground mb-4">This applies to any change to:</p>
              <CheckList ok={true} items={[
                'Photos (adding, removing or replacing)',
                'Verification video',
                'Name, age or location',
                'Profile description',
                'Contact details or social media',
              ]} />
              <p className="text-sm text-muted-foreground mt-5">
                This keeps <strong className={strong}>profiles genuine</strong> and protects the OneSugar community from unwanted changes and fake profiles.
              </p>
            </section>

            <Divider />

            {/* 8. TIPS */}
            <section>
              <SectionTitle id="dicas" eyebrow="08" title="Tips for a better listing" icon={<Lightbulb className="h-4 w-4" />} />
              <div className="space-y-3">
                {[
                  { title: 'A complete profile gets more visibility', desc: 'Profiles with every feature filled in stand out more in results and filters.' },
                  { title: 'Photos that convert', desc: 'Clean, neutral background, good lighting (natural light if possible), a natural expression and a variety of poses.' },
                  { title: 'A short description that works', desc: 'Use the 150 characters to say what makes you different. It is the first thing clients read in the listing.' },
                  { title: 'An honest full description', desc: 'Clear, professional text about you, what you like and what you offer (30 to 500 characters). Many visitors are from abroad, so a few lines in English help.' },
                  { title: 'Price', desc: 'The typical range on the platform is €150 to €1,500 per hour. Adjust it to your positioning.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Divider />

            {/* 9. FAQ */}
            <section>
              <SectionTitle id="faq" eyebrow="09" title="Frequently asked questions" icon={<HelpCircle className="h-4 w-4" />} />
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {faq.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer select-none text-sm font-medium text-foreground hover:bg-muted/30 transition-colors list-none">
                      {item.q}
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                      {item.cta && (
                        <LocaleLink locale={L} href="/checkout" className="ml-1 text-primary hover:underline font-medium">
                          See plans (in Portuguese) →
                        </LocaleLink>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <Divider />

            {/* 10. SUPPORT */}
            <section>
              <SectionTitle id="suporte" eyebrow="10" title="Need more help?" icon={<Headphones className="h-4 w-4" />} />
              <p className="text-sm text-muted-foreground mb-5">Our team is here to help you.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/351913895353"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors p-5 group"
                >
                  <IconBrandWhatsapp className="h-8 w-8 text-[#25D366] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">WhatsApp</p>
                    <p className="text-base font-bold text-foreground group-hover:text-[#25D366] transition-colors">+351 913 895 353</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
                  <Clock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Support hours (Lisbon time)</p>
                    <p className="text-base font-bold text-foreground">08:00 to 18:00</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
