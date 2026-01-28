import Link from "next/link"
import { ArrowLeft, Shield, Users, Zap, Globe, Heart, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface AboutFeature {
  icon: "shield" | "users" | "zap" | "globe" | "heart" | "lock"
  title: string
  description: string
}

export interface AboutSection {
  title: string
  content: string | string[]
}

export interface AboutPageProps {
  title: string
  intro: string
  highlightText?: string
  features: AboutFeature[]
  sections: AboutSection[]
  ctaText?: string
  ctaLink?: string
  footer?: string
}

const iconMap = {
  shield: Shield,
  users: Users,
  zap: Zap,
  globe: Globe,
  heart: Heart,
  lock: Lock,
}

export function AboutPage({
  title,
  intro,
  highlightText,
  features,
  sections,
  ctaText,
  ctaLink,
  footer,
}: AboutPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {intro}
          </p>
          {highlightText && (
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Shield className="h-5 w-5" />
                <p className="text-sm font-medium">{highlightText}</p>
              </div>
            </div>
          )}
        </header>

        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon]
            return (
              <div
                key={index}
                className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={index} className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
              {Array.isArray(section.content) ? (
                <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                  {section.content.map((item, i) => (
                    <li key={i} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              )}
            </section>
          ))}
        </div>

        {ctaText && ctaLink && (
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href={ctaLink}>{ctaText}</Link>
            </Button>
          </div>
        )}

        {footer && (
          <footer className="mt-12 text-center">
            <p className="text-lg font-medium text-foreground">{footer}</p>
          </footer>
        )}
      </div>
    </main>
  )
}
