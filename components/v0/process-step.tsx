import type { LucideIcon } from "lucide-react"

interface ProcessStepProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ProcessStep({ icon: Icon, title, description }: ProcessStepProps) {
  return (
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

