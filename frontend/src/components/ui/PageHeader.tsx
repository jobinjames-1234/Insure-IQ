import React from "react"
import { cn } from "../../lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6", className)}>
      <div>
        <h1 className="font-h1 text-h1 tracking-tight text-on-surface">{title}</h1>
        {description && <p className="font-body text-body text-text-secondary mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
