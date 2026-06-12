"use client"

import { cn } from "@/lib/utils"
import { tremorColors, type TremorColorKey } from "@/lib/chart-utils-tremor"

interface BarListProps {
  data: { name: string; value: number; href?: string }[]
  color?: TremorColorKey
  valueFormatter?: (value: number) => string
  className?: string
}

export function BarList({ data, color = "blue", valueFormatter = (v: number) => v.toString(), className }: BarListProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={cn("space-y-2", className)} tremor-id="tremor-raw">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            {item.href ? (
              <a href={item.href} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 truncate">{item.name}</a>
            ) : (
              <span className="text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
            )}
            <span className="text-gray-900 dark:text-gray-50 font-medium tabular-nums ml-2">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
            <div className={cn("h-full rounded-full transition-all", tremorColors[color].bg)}
              style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
