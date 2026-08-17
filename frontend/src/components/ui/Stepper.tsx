import { cn } from "../../lib/utils"
import { Check } from "lucide-react"

export interface Step {
  id: string | number
  title: string
  description?: string
  status: "complete" | "current" | "upcoming"
}

interface StepperProps {
  steps: Step[]
  className?: string
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <ol className="flex items-center w-full">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={cn("relative", stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20 w-full" : "")}>
            {stepIdx !== steps.length - 1 ? (
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-0.5 bg-slate-200" aria-hidden="true">
                {step.status === "complete" && (
                  <div className="h-full bg-indigo-600 w-full" />
                )}
              </div>
            ) : null}
            <div className="relative flex items-center justify-center">
              {step.status === "complete" ? (
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center ring-4 ring-white">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : step.status === "current" ? (
                <div className="h-8 w-8 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center ring-4 ring-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center ring-4 ring-white">
                  <span className="text-slate-500 text-xs font-medium">{stepIdx + 1}</span>
                </div>
              )}
            </div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-center whitespace-nowrap">
              <span className={cn("text-xs font-medium", step.status === "current" ? "text-indigo-600" : "text-slate-500")}>
                {step.title}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className="h-10" /> {/* Spacer for labels */}
    </div>
  )
}
