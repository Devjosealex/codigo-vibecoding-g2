export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const chartColors = {
  blue: { bg: "bg-blue-500", stroke: "stroke-blue-500", fill: "fill-blue-500", text: "text-blue-500" },
  orange: { bg: "bg-orange-500", stroke: "stroke-orange-500", fill: "fill-orange-500", text: "text-orange-500" },
  emerald: { bg: "bg-emerald-500", stroke: "stroke-emerald-500", fill: "fill-emerald-500", text: "text-emerald-500" },
  violet: { bg: "bg-violet-500", stroke: "stroke-violet-500", fill: "fill-violet-500", text: "text-violet-500" },
  amber: { bg: "bg-amber-500", stroke: "stroke-amber-500", fill: "fill-amber-500", text: "text-amber-500" },
  cyan: { bg: "bg-cyan-500", stroke: "stroke-cyan-500", fill: "fill-cyan-500", text: "text-cyan-500" },
  pink: { bg: "bg-pink-500", stroke: "stroke-pink-500", fill: "fill-pink-500", text: "text-pink-500" },
  rose: { bg: "bg-rose-500", stroke: "stroke-rose-500", fill: "fill-rose-500", text: "text-rose-500" },
  sky: { bg: "bg-sky-500", stroke: "stroke-sky-500", fill: "fill-sky-500", text: "text-sky-500" },
} as const satisfies Record<string, Record<ColorUtility, string>>

export type ChartColorKey = keyof typeof chartColors

export const CHART_COLORS: ChartColorKey[] = [
  "blue", "orange", "emerald", "violet", "amber", "cyan", "pink", "rose", "sky",
] as const

export function hexColor(color: ChartColorKey): string {
  const map: Record<ChartColorKey, string> = {
    blue: "#2563EB",
    orange: "#F97316",
    emerald: "#10B981",
    violet: "#8B5CF6",
    amber: "#F59E0B",
    cyan: "#06B6D4",
    pink: "#EC4899",
    rose: "#F43F5E",
    sky: "#0284C7",
  }
  return map[color] ?? "#6B7280"
}

export const STATUS_COLORS: Record<string, ChartColorKey> = {
  pending: "amber",
  assigned: "blue",
  in_transit: "sky",
  delivered: "emerald",
  returned: "orange",
  cancelled: "rose",
}
