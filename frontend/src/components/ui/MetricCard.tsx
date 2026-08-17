import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./Card"
import { cn } from "../../lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  trend?: number // percentage
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, trend, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={cn("text-xs flex items-center mt-1", trend >= 0 ? "text-emerald-600" : "text-red-600")}>
            {trend >= 0 ? <ArrowUpIcon className="mr-1 h-3 w-3" /> : <ArrowDownIcon className="mr-1 h-3 w-3" />}
            {Math.abs(trend)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}
