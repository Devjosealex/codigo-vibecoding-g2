import { cn } from "@/lib/utils"

export const focusInput = [
  "focus:ring-2",
  "focus:ring-blue-200 dark:focus:ring-blue-700/30",
  "focus:border-blue-500 dark:focus:border-blue-700",
]

export const focusRing = [
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  "outline-blue-500 dark:outline-blue-500",
]

export const hasErrorInput = [
  "ring-2",
  "border-red-500 dark:border-red-700",
  "ring-red-200 dark:ring-red-700/30",
]

export function tremorTooltipContent() {
  return cn(
    "rounded-md border text-sm shadow-md",
    "border-gray-200 dark:border-gray-800",
    "bg-white dark:bg-gray-950",
  )
}

export function tremorTooltipLabel() {
  return cn(
    "font-medium",
    "text-gray-900 dark:text-gray-50",
  )
}

export function tremorTooltipItem() {
  return cn(
    "text-right whitespace-nowrap",
    "text-gray-700 dark:text-gray-300",
  )
}

export function tremorTooltipValue() {
  return cn(
    "text-right font-medium whitespace-nowrap tabular-nums",
    "text-gray-900 dark:text-gray-50",
  )
}
