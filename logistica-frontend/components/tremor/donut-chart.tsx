"use client"

import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { tremorColors, hexColorTremor, type TremorColorKey } from "@/lib/chart-utils-tremor"

interface DonutChartProps {
  data: { name: string; value: number }[]
  category: string
  value: string
  colors?: TremorColorKey[]
  valueFormatter?: (value: number) => string
  variant?: "donut" | "pie"
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

export function DonutChart({
  data, category, value, colors = ["blue", "cyan", "violet", "amber", "emerald", "pink", "rose", "orange"],
  valueFormatter = (v: number) => v.toString(),
  variant = "donut", showLabel = true, showTooltip = true, className,
}: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)

  return (
    <div className={cn("w-full h-full", className)} tremor-id="tremor-raw">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          {showLabel && variant === "donut" && (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
              className="fill-gray-700 dark:fill-gray-300 text-sm font-medium">
              {valueFormatter(total)}
            </text>
          )}
          <Pie data={data} cx="50%" cy="50%" dataKey={value} nameKey={category}
            innerRadius={variant === "donut" ? "60%" : "0%"} outerRadius="100%"
            startAngle={90} endAngle={-270} stroke="" strokeLinejoin="round"
            className="stroke-white dark:stroke-gray-950" isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={hexColorTremor(colors[i % colors.length])} />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip wrapperStyle={{ outline: "none" }} isAnimationActive={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const item = payload[0]
                return (
                  <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm shadow-md px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", tremorColors[colors[data.findIndex(d => d.name === item.name)] ?? "gray" as TremorColorKey].bg)} />
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                      <span className="text-gray-900 dark:text-gray-50 font-medium tabular-nums">{valueFormatter(item.value as number)}</span>
                    </div>
                  </div>
                )
              }} />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
