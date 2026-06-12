import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import type { Header } from "@tanstack/react-table"

export function DataTableSortHeader<TData, TValue>({
  header,
  children,
}: {
  header: Header<TData, TValue>
  children: React.ReactNode
}) {
  const sorted = header.column.getIsSorted()
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      {header.column.getCanSort() &&
        (sorted === "asc" ? (
          <ArrowUp className="h-3 w-3 shrink-0" />
        ) : sorted === "desc" ? (
          <ArrowDown className="h-3 w-3 shrink-0" />
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/40" />
        ))}
    </span>
  )
}
