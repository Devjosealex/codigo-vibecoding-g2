"use client"

import React from "react"
import {
  Area, CartesianGrid, AreaChart as RechartsAreaChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { tremorColors, getColorClassName, type TremorColorKey } from "@/lib/chart-utils-tremor"

export type TremorKey = TremorColorKey

export interface TremorAreaChartProps {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: TremorColorKey[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showTooltip?: boolean
  showGridLines?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  yAxisWidth?: number
  autoMinValue?: boolean
  type?: "default" | "stacked" | "percent"
  startEndOnly?: boolean
  className?: string
}

export function AreaChart({
  data, index, categories, colors = ["blue", "cyan", "violet", "amber", "emerald", "pink", "rose", "orange"],
  valueFormatter = (v: number) => v.toString(),
  showLegend = true, showTooltip = true, showGridLines = true,
  showXAxis = true, showYAxis = true, yAxisWidth = 56,
  autoMinValue = false, type = "default", startEndOnly = false,
  className,
}: TremorAreaChartProps) {
  const stacked = type === "stacked" || type === "percent"
  const [activeLegend, setActiveLegend] = React.useState<string | undefined>()
  const [activeDot, setActiveDot] = React.useState<{ index?: number; dataKey?: string }>()
  const hasInteraction = false

  const chartColors = categories.map((c, i) => colors[i % colors.length])

  return (
    <div className={cn("w-full", className)} tremor-id="tremor-raw">
      {showLegend && categories.length > 1 && (
        <div className="flex flex-wrap gap-3 pb-2">
          {categories.map((cat, i) => (
            <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
              <span className={cn("h-[3px] w-3.5 rounded-full", tremorColors[chartColors[i]].bg)} />
              {cat}
            </span>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          stackOffset={type === "percent" ? "expand" : undefined}>
          {showGridLines && <CartesianGrid className="stroke-gray-200 dark:stroke-gray-800" strokeDasharray="3 3" horizontal={true} vertical={false} />}
          <XAxis dataKey={index} hide={!showXAxis} tickLine={false} axisLine={false}
            className="text-xs fill-gray-500 dark:fill-gray-500" tick={{ transform: "translate(0, 6)" }}
            interval={startEndOnly ? "preserveStartEnd" : "equidistantPreserveStart"}
            ticks={startEndOnly ? [data[0]?.[index], data[data.length - 1]?.[index]] : undefined} />
          <YAxis hide={!showYAxis} width={yAxisWidth} tickLine={false} axisLine={false}
            className="text-xs fill-gray-500 dark:fill-gray-500" tick={{ transform: "translate(-3, 0)" }}
            domain={autoMinValue ? ["auto", "auto"] : [0, "auto"]}
            tickFormatter={type === "percent" ? (v: number) => `${(v * 100).toFixed(0)}%` : valueFormatter} />
          {showTooltip && (
            <Tooltip wrapperStyle={{ outline: "none" }} isAnimationActive={false}
              cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm shadow-md">
                    <div className="border-b border-inherit px-4 py-2 font-medium text-gray-900 dark:text-gray-50">{label}</div>
                    <div className="space-y-1 px-4 py-2">
                      {payload.map((entry: any, idx: number) => {
                        const color = chartColors[categories.indexOf(entry.dataKey)] ?? "gray"
                        return (
                          <div key={idx} className="flex items-center justify-between space-x-8">
                            <div className="flex items-center space-x-2">
                              <span className={cn("h-[3px] w-3.5 rounded-full", tremorColors[color].bg)} />
                              <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap text-right">{entry.name}</span>
                            </div>
                            <span className="text-gray-900 dark:text-gray-50 font-medium tabular-nums whitespace-nowrap text-right">{valueFormatter(entry.value as number)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }} />
          )}
          {categories.map((cat, i) => {
            const color = chartColors[i]
            const colorClass = tremorColors[color]
            const categoryId = `area-grad-${cat.replace(/\s+/g, "-")}`
            return (
              <React.Fragment key={cat}>
                <defs>
                  <linearGradient id={categoryId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="linear" dataKey={cat} name={cat} stroke="" fill={`url(#${categoryId})`}
                  className={colorClass.stroke} strokeWidth={2} fillOpacity={1} isAnimationActive={false}
                  stackId={stacked ? "stack" : undefined} connectNulls />
              </React.Fragment>
            )
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
