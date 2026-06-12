"use client"

import { cn } from "@/lib/utils"
import { tremorColors, type TremorColorKey } from "@/lib/chart-utils-tremor"

interface CategoryBarProps {
  values: { label: string; value: number; color: TremorColorKey }[]
  className?: string
}

export function CategoryBar({ values, className }: CategoryBarProps) {
  const total = values.reduce((s, v) => s + v.value, 0) || 1

  return (
    <div className={cn("space-y-2", className)} tremor-id="tremor-raw">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        {values.map((v, i) => (
          <div key={v.label} className={cn("h-full transition-all", tremorColors[v.color].bg)}
            style={{ width: `${(v.value / total) * 100}%`, marginLeft: i > 0 ? "2px" : undefined }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {values.map((v) => (
          <span key={v.label} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-full", tremorColors[v.color].bg)} />
            {v.label}: {v.value}
          </span>
        ))}
      </div>
    </div>
  )
}
