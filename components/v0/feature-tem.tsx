import type { LucideIcon } from "lucide-react"

interface FeatureItemProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="h-6 w-6 text-primary" />
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

