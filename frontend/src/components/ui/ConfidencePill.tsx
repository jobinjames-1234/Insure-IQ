import { cn } from "../../lib/utils"
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react"

interface ConfidencePillProps {
  score: number // 0-100
  className?: string
}

export function ConfidencePill({ score, className }: ConfidencePillProps) {
  let variant = "high"
  if (score < 50) variant = "low"
  else if (score < 80) variant = "medium"

  const styles = {
    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-red-50 text-red-700 border-red-200"
  }

  const Icon = variant === "high" ? ShieldCheck : (variant === "low" ? ShieldAlert : Shield)

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm", styles[variant as keyof typeof styles], className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{score} {variant}</span>
    </div>
  )
}
