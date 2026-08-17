import { cn } from "../../lib/utils"
import { CheckCircle2, Star } from "lucide-react"

interface TrustStripProps {
  rating?: string
  settlementRatio?: string
  className?: string
}

export function TrustStrip({ rating = "4.9/5", settlementRatio = "99.8%", className }: TrustStripProps) {
  return (
    <div className={cn("flex items-center gap-4 text-xs text-slate-500 font-medium", className)}>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span>{settlementRatio} Settlement Ratio</span>
      </div>
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        <span>{rating} User Rating</span>
      </div>
      <div className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
        Verified
      </div>
    </div>
  )
}
