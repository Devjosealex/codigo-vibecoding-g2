"use client"

import { cn } from "@/lib/utils"
import { tremorColors, type TremorColorKey } from "@/lib/chart-utils-tremor"

interface ProgressCircleProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  color?: TremorColorKey
  showLabel?: boolean
  className?: string
}

export function ProgressCircle({ value, max = 100, size = "md", color = "blue", showLabel = true, className }: ProgressCircleProps) {
  const pct = Math.min(Math.max(value / max, 0), 1)
  const sizeMap = { sm: 40, md: 60, lg: 80 }
  const strokeMap = { sm: 4, md: 5, lg: 6 }
  const dim = sizeMap[size]
  const stroke = strokeMap[size]
  const r = (dim - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="currentColor"
          className="text-gray-200 dark:text-gray-800" strokeWidth={stroke} />
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none"
          className={cn("transition-all duration-500", tremorColors[color].stroke)}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-50">
          {Math.round(pct * 100)}%
        </span>
      )}
    </div>
  )
}
