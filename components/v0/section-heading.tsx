interface SectionHeadingProps {
  title: string
  description?: string
  centered?: boolean
}

export function SectionHeading({ title, description, centered = true }: SectionHeadingProps) {
  return (
    <div className={`space-y-2 ${centered ? "text-center" : ""}`}>
      <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">{title}</h2>
      {description && (
        <p
          className={`${centered ? "mx-auto" : ""} max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed`}
        >
          {description}
        </p>
      )}
    </div>
  )
}

