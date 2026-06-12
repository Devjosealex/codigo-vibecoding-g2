"use client"

import { useMemo } from "react"
import { AreaChart, BarChart, DonutChart } from "@/components/tremor"
import type { TremorColorKey } from "@/components/tremor"
import { format, parseISO, differenceInBusinessDays } from "date-fns"
import { es } from "date-fns/locale"
import type { Shipment } from "@/lib/shipments.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { STATUS_COLORS, hexColor } from "@/lib/chart-utils"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  pending: "Pendiente", assigned: "Asignado", in_transit: "En tránsito",
  delivered: "Entregado", returned: "Devuelto", cancelled: "Cancelado",
}

const statusColors: Record<string, TremorColorKey> = {
  pending: "amber", assigned: "blue", in_transit: "sky",
  delivered: "emerald", returned: "orange", cancelled: "rose",
}

export function ShipmentsTrend({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const months: Record<string, Record<string, number>> = {}
    for (const s of shipments) {
      const m = format(parseISO(s.created_at), "yyyy-MM")
      if (!months[m]) months[m] = {}
      months[m][s.status] = (months[m][s.status] ?? 0) + 1
    }
    const keys = Object.keys(months).sort()
    const allStatuses = Object.keys(statusLabels)
    return keys.map((month) => {
      const row: Record<string, string | number> = {
        date: format(parseISO(month + "-01"), "MMM yyyy", { locale: es }),
      }
      for (const st of allStatuses) row[statusLabels[st]] = months[month][st] ?? 0
      return row
    })
  }, [shipments])

  const categories = Object.values(statusLabels)

  if (!data.length) return <EmptyCard title="Envíos en el tiempo" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Envíos en el tiempo</CardTitle></CardHeader>
      <CardContent>
        <AreaChart
          data={data}
          index="date"
          categories={categories}
          colors={["amber", "blue", "sky", "emerald", "orange", "rose"]}
          valueFormatter={(v) => v.toString()}
          showLegend={true}
          type="stacked"
          className="h-72"
        />
      </CardContent>
    </Card>
  )
}

export function ShipmentsByStatus({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of shipments) counts[s.status] = (counts[s.status] ?? 0) + 1
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([st, count]) => ({
        name: statusLabels[st] ?? st,
        value: count,
        color: statusColors[st],
      }))
  }, [shipments])

  if (!data.length) return <EmptyCard title="Envíos por estado" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Envíos por estado</CardTitle></CardHeader>
      <CardContent>
        <DonutChart
          data={data}
          category="name"
          value="value"
          colors={data.map((d) => d.color)}
          valueFormatter={(v) => v.toString()}
          className="h-52"
        />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {data.map((e) => (
            <span key={e.name} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hexColor(STATUS_COLORS[Object.keys(statusLabels).find(k => statusLabels[k] === e.name) ?? ""] ?? "gray") }} />
              {e.name}: {e.value}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RevenueMonthly({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const months: Record<string, number> = {}
    for (const s of shipments) {
      const m = format(parseISO(s.created_at), "yyyy-MM")
      months[m] = (months[m] ?? 0) + Number(s.base_cost)
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, total]) => ({
        date: format(parseISO(m + "-01"), "MMM yyyy", { locale: es }),
        total,
      }))
  }, [shipments])

  if (!data.length) return <EmptyCard title="Ingresos x mes" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Ingresos x mes</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="date"
          categories={["total"]}
          colors={["emerald"]}
          valueFormatter={(v) => `S/ ${v.toFixed(2)}`}
          className="h-64"
          showLegend={false}
        />
      </CardContent>
    </Card>
  )
}

export function RevenueVsCost({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const months: Record<string, { base: number; calc: number }> = {}
    for (const s of shipments) {
      if (!s.calculated_cost) continue
      const m = format(parseISO(s.created_at), "yyyy-MM")
      if (!months[m]) months[m] = { base: 0, calc: 0 }
      months[m].base += Number(s.base_cost)
      months[m].calc += Number(s.calculated_cost)
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({
        date: format(parseISO(m + "-01"), "MMM yyyy", { locale: es }),
        "Costo base": v.base,
        "Costo calculado": v.calc,
      }))
  }, [shipments])

  if (!data.length) return <EmptyCard title="Costo vs Ingreso" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Costo base vs calculado</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="date"
          categories={["Costo base", "Costo calculado"]}
          colors={["blue", "cyan"]}
          valueFormatter={(v) => `S/ ${v.toFixed(2)}`}
          className="h-64"
        />
      </CardContent>
    </Card>
  )
}

export function DeliveryTimeChart({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const delivered = shipments.filter((s) => s.status === "delivered" && s.created_at && s.delivered_at)
    const months: Record<string, { total: number; count: number }> = {}
    for (const s of delivered) {
      const month = format(parseISO(s.created_at), "yyyy-MM")
      const created = parseISO(s.created_at)
      const del = parseISO(s.delivered_at!)
      const days = differenceInBusinessDays(del, created)
      if (days < 0) continue
      if (!months[month]) months[month] = { total: 0, count: 0 }
      months[month].total += days
      months[month].count += 1
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, { total, count }]) => ({
        date: format(parseISO(m + "-01"), "MMM yyyy", { locale: es }),
        días: Math.round((total / count) * 10) / 10,
      }))
  }, [shipments])

  if (!data.length) return <EmptyCard title="Tiempo promedio de entrega" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Tiempo promedio de entrega</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="date"
          categories={["días"]}
          colors={["violet"]}
          valueFormatter={(v) => `${v} días`}
          className="h-64"
          showLegend={false}
        />
      </CardContent>
    </Card>
  )
}

export function TopDestinationsChart({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const cities: Record<string, number> = {}
    for (const s of shipments) {
      if (s.destination_city) cities[s.destination_city] = (cities[s.destination_city] ?? 0) + 1
    }
    return Object.entries(cities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }))
  }, [shipments])

  if (!data.length) return <EmptyCard title="Top ciudades destino" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Top ciudades destino</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="city"
          categories={["count"]}
          colors={["orange"]}
          layout="vertical"
          valueFormatter={(v) => v.toString()}
          className="h-64"
          showLegend={false}
          yAxisWidth={90}
        />
      </CardContent>
    </Card>
  )
}

export function OnTimeRate({ shipments }: { shipments: Shipment[] }) {
  const { data, totalDelivered, onTimeRate } = useMemo(() => {
    const delivered = shipments.filter((s) => s.status === "delivered" && s.delivered_at && s.scheduled_date)
    let onTime = 0
    for (const s of delivered) {
      if (!s.scheduled_date || !s.delivered_at) continue
      const scheduled = new Date(s.scheduled_date + "T23:59:59")
      const actual = new Date(s.delivered_at)
      if (actual <= scheduled) onTime++
    }
    return { totalDelivered: delivered.length, onTimeRate: delivered.length > 0 ? Math.round((onTime / delivered.length) * 100) : 0, data: [{ name: "A tiempo", value: onTime, color: "emerald" as TremorColorKey }, { name: "Retrasado", value: delivered.length - onTime, color: "rose" as TremorColorKey }].filter(d => d.value > 0) }
  }, [shipments])

  if (!data.length) return <EmptyCard title="Rendimiento de entregas" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Rendimiento de entregas</CardTitle></CardHeader>
      <CardContent>
        <div className="relative">
          <DonutChart
            data={data}
            category="name"
            value="value"
            colors={["emerald", "rose"]}
            valueFormatter={(v) => v.toString()}
            className="h-52"
            showLabel={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold tabular-nums">{onTimeRate}%</span>
            <span className="text-xs text-muted-foreground">a tiempo</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {data.map((e) => (
            <span key={e.name} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color === "emerald" ? "#10B981" : "#F43F5E" }} />
              {e.name}: {e.value}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function VolumeByWeekday({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const counts = new Array(7).fill(0)
    for (const s of shipments) {
      const d = parseISO(s.created_at).getDay()
      counts[d]++
    }
    return days.map((name, i) => ({ name, envíos: counts[i] }))
  }, [shipments])

  if (!data.some(d => d.envíos > 0)) return <EmptyCard title="Envíos por día de semana" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Envíos por día de semana</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="name"
          categories={["envíos"]}
          colors={["blue"]}
          valueFormatter={(v) => v.toString()}
          className="h-52"
          showLegend={false}
        />
      </CardContent>
    </Card>
  )
}

export function ShipmentsByOrigin({ shipments, warehouses: warehouseMap }: { shipments: Shipment[]; warehouses: Record<number, string> }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of shipments) {
      const name = s.origin_warehouse ? (warehouseMap[s.origin_warehouse] ?? `Almacén #${s.origin_warehouse}`) : "Sin almacén"
      counts[name] = (counts[name] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))
  }, [shipments, warehouseMap])

  if (!data.length) return <EmptyCard title="Envíos por almacén" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Envíos por almacén origen</CardTitle></CardHeader>
      <CardContent>
        <DonutChart
          data={data}
          category="name"
          value="value"
          colors={["blue", "cyan", "violet", "amber", "emerald", "pink"]}
          valueFormatter={(v) => v.toString()}
          className="h-52"
        />
      </CardContent>
    </Card>
  )
}

export function CostMarginTrend({ shipments }: { shipments: Shipment[] }) {
  const data = useMemo(() => {
    const months: Record<string, { total: number; count: number }> = {}
    for (const s of shipments) {
      if (!s.calculated_cost) continue
      const m = format(parseISO(s.created_at), "yyyy-MM")
      if (!months[m]) months[m] = { total: 0, count: 0 }
      months[m].total += Number(s.calculated_cost) - Number(s.base_cost)
      months[m].count++
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, { total, count }]) => ({
        date: format(parseISO(m + "-01"), "MMM yyyy", { locale: es }),
        margen: Math.round((total / count) * 100) / 100,
      }))
  }, [shipments])

  if (!data.length) return <EmptyCard title="Margen de costo" />

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Margen de costo promedio</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="date"
          categories={["margen"]}
          colors={["fuchsia"]}
          valueFormatter={(v) => `S/ ${v.toFixed(2)}`}
          className="h-64"
          showLegend={false}
        />
      </CardContent>
    </Card>
  )
}

function EmptyCard({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">Sin datos</CardContent>
    </Card>
  )
}
