"use client"

import React from "react"
import {
  Bar, CartesianGrid, BarChart as RechartsBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { tremorColors, type TremorColorKey } from "@/lib/chart-utils-tremor"

interface BarChartProps {
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
  layout?: "vertical" | "horizontal"
  type?: "default" | "stacked" | "percent"
  className?: string
}

export function BarChart({
  data, index, categories, colors = ["blue", "cyan", "violet", "amber", "emerald", "pink"],
  valueFormatter = (v: number) => v.toString(),
  showLegend = true, showTooltip = true, showGridLines = true,
  showXAxis = true, showYAxis = true, yAxisWidth = 56,
  autoMinValue = false, layout = "horizontal", type = "default",
  className,
}: BarChartProps) {
  const stacked = type === "stacked" || type === "percent"
  const chartColors = categories.map((c, i) => colors[i % colors.length])

  return (
    <div className={cn("w-full", className)} tremor-id="tremor-raw">
      {showLegend && categories.length > 1 && (
        <div className="flex flex-wrap gap-3 pb-2">
          {categories.map((cat, i) => (
            <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
              <span className={cn("size-2 rounded-xs", tremorColors[chartColors[i]].bg)} />
              {cat}
            </span>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          layout={layout} barCategoryGap={layout === "horizontal" ? "10%" : "20%"}
          stackOffset={type === "percent" ? "expand" : undefined}>
          {showGridLines && <CartesianGrid className="stroke-gray-200 dark:stroke-gray-800" strokeDasharray="3 3"
            horizontal={layout !== "vertical"} vertical={layout === "vertical"} />}
          {layout === "horizontal" ? (
            <> 
              <XAxis dataKey={index} hide={!showXAxis} tickLine={false} axisLine={false}
                className="text-xs fill-gray-500 dark:fill-gray-500" tick={{ transform: "translate(0, 6)" }} />
              <YAxis hide={!showYAxis} width={yAxisWidth} tickLine={false} axisLine={false}
                className="text-xs fill-gray-500 dark:fill-gray-500" tick={{ transform: "translate(-3, 0)" }}
                domain={autoMinValue ? ["auto", "auto"] : [0, "auto"]}
                tickFormatter={valueFormatter} />
            </>
          ) : (
            <>
              <XAxis type="number" hide={!showXAxis} tickLine={false} axisLine={false}
                className="text-xs fill-gray-500 dark:fill-gray-500"
                domain={autoMinValue ? ["auto", "auto"] : [0, "auto"]}
                tickFormatter={valueFormatter} />
              <YAxis type="category" dataKey={index} hide={!showYAxis} width={yAxisWidth} tickLine={false} axisLine={false}
                className="text-xs fill-gray-500 dark:fill-gray-500" />
            </>
          )}
          {showTooltip && (
            <Tooltip wrapperStyle={{ outline: "none" }} isAnimationActive={false}
              cursor={{ fill: "#d1d5db", opacity: 0.3 }}
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
                              <span className={cn("size-2 rounded-xs", tremorColors[color].bg)} />
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
            return (
              <Bar key={cat} dataKey={cat} name={cat} fill="currentColor"
                className={colorClass.fill} radius={layout === "horizontal" ? [4, 4, 0, 0] : [0, 4, 4, 0]}
                isAnimationActive={false}
                stackId={stacked ? "stack" : undefined} />
            )
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
