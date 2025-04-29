import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface ServiceCardProps {
  title: string
  description?: string
}

export function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-2">
      <div className="flex h-full flex-col justify-between rounded-md p-6">
        <div className="space-y-2">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description || "Profissionais qualificados para atender às suas necessidades."}
          </p>
        </div>
        <Link href="#" className="inline-flex items-center text-sm font-medium text-primary">
          Ver mais
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

