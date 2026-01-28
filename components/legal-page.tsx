import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export interface LegalSection {
  title: string
  content: string | string[]
  subsections?: {
    title: string
    content: string | string[]
  }[]
}

export interface LegalPageProps {
  title: string
  lastUpdated: string
  intro?: string
  sections: LegalSection[]
  footer?: string
}

export function LegalPage({ title, lastUpdated, intro, sections, footer }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: {lastUpdated}
          </p>
        </header>

        {intro && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <p className="text-foreground leading-relaxed">{intro}</p>
          </div>
        )}

        <div className="space-y-8">
          {sections.map((section, index) => (
            <section key={index} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                  {section.content.map((item, i) => (
                    <li key={i} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              )}
              {section.subsections && (
                <div className="ml-4 space-y-4 border-l-2 border-border pl-4">
                  {section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="space-y-2">
                      <h3 className="font-medium text-foreground">{subsection.title}</h3>
                      {Array.isArray(subsection.content) ? (
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          {subsection.content.map((item, i) => (
                            <li key={i} className="leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">{subsection.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {footer && (
          <footer className="mt-12 rounded-lg border border-border bg-muted/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">{footer}</p>
          </footer>
        )}
      </div>
    </main>
  )
}
