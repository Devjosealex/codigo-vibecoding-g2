export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const tremorColors = {
  blue: { bg: "bg-blue-500", stroke: "stroke-blue-500", fill: "fill-blue-500", text: "text-blue-500" },
  emerald: { bg: "bg-emerald-500", stroke: "stroke-emerald-500", fill: "fill-emerald-500", text: "text-emerald-500" },
  violet: { bg: "bg-violet-500", stroke: "stroke-violet-500", fill: "fill-violet-500", text: "text-violet-500" },
  amber: { bg: "bg-amber-500", stroke: "stroke-amber-500", fill: "fill-amber-500", text: "text-amber-500" },
  gray: { bg: "bg-gray-500", stroke: "stroke-gray-500", fill: "fill-gray-500", text: "text-gray-500" },
  cyan: { bg: "bg-cyan-500", stroke: "stroke-cyan-500", fill: "fill-cyan-500", text: "text-cyan-500" },
  pink: { bg: "bg-pink-500", stroke: "stroke-pink-500", fill: "fill-pink-500", text: "text-pink-500" },
  lime: { bg: "bg-lime-500", stroke: "stroke-lime-500", fill: "fill-lime-500", text: "text-lime-500" },
  fuchsia: { bg: "bg-fuchsia-500", stroke: "stroke-fuchsia-500", fill: "fill-fuchsia-500", text: "text-fuchsia-500" },
  rose: { bg: "bg-rose-500", stroke: "stroke-rose-500", fill: "fill-rose-500", text: "text-rose-500" },
  sky: { bg: "bg-sky-500", stroke: "stroke-sky-500", fill: "fill-sky-500", text: "text-sky-500" },
  orange: { bg: "bg-orange-500", stroke: "stroke-orange-500", fill: "fill-orange-500", text: "text-orange-500" },
} as const satisfies Record<string, Record<ColorUtility, string>>

export type TremorColorKey = keyof typeof tremorColors

export const TREMOR_COLORS: TremorColorKey[] = Object.keys(tremorColors) as TremorColorKey[]

export function constructCategoryColors(categories: string[], colors: TremorColorKey[]): Map<string, TremorColorKey> {
  const map = new Map<string, TremorColorKey>()
  categories.forEach((cat, i) => map.set(cat, colors[i % colors.length]))
  return map
}

export function getColorClassName(color: TremorColorKey, type: ColorUtility): string {
  return tremorColors[color]?.[type] ?? tremorColors.gray[type]
}

export function hexColorTremor(color: TremorColorKey): string {
  const map: Record<TremorColorKey, string> = {
    blue: "#3B82F6", emerald: "#10B981", violet: "#8B5CF6",
    amber: "#F59E0B", gray: "#6B7280", cyan: "#06B6D4",
    pink: "#EC4899", lime: "#84CC16", fuchsia: "#D946EF",
    rose: "#F43F5E", sky: "#0284C7", orange: "#F97316",
  }
  return map[color]
}

export function getYAxisDomain(autoMinValue: boolean, minValue?: number, maxValue?: number) {
  return [autoMinValue ? "auto" : (minValue ?? 0), maxValue ?? "auto"] as [string | number, string | number]
}

export function hasOnlyOneValueForKey(array: any[], key: string): boolean {
  const val: any[] = []
  for (const obj of array) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      val.push(obj[key])
      if (val.length > 1) return false
    }
  }
  return true
}

export const STATUS_CHART_COLORS: Record<string, TremorColorKey> = {
  pending: "amber", assigned: "blue", in_transit: "sky",
  delivered: "emerald", returned: "orange", cancelled: "rose",
}
