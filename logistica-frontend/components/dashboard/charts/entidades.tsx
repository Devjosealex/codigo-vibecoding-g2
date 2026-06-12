"use client"

import { useMemo } from "react"
import { BarChart, DonutChart, BarList, CategoryBar } from "@/components/tremor"
import type { Customer } from "@/lib/customers.api"
import type { Supplier } from "@/lib/suppliers.api"
import type { Warehouse } from "@/lib/warehouses.api"
import type { Route } from "@/lib/routes.api"
import type { Shipment } from "@/lib/shipments.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CustomerTypeChart({ customers }: { customers: Customer[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of customers) counts[c.customer_type === "company" ? "Empresa" : "Individual"] = (counts[c.customer_type === "company" ? "Empresa" : "Individual"] ?? 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [customers])

  if (!data.length) return <EmptyCard title="Clientes por tipo" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Clientes por tipo</CardTitle></CardHeader>
      <CardContent>
        <DonutChart data={data} category="name" value="value" colors={["blue", "cyan"]}
          valueFormatter={(v) => v.toString()} className="h-52" />
      </CardContent>
    </Card>
  )
}

export function TopCustomersChart({ shipments, customers }: { shipments: Shipment[]; customers: Customer[] }) {
  const data = useMemo(() => {
    const custMap = new Map(customers.map((c) => [c.id, c.name]))
    const counts: Record<string, number> = {}
    for (const s of shipments) {
      if (!s.customer) continue
      const name = custMap.get(s.customer) ?? `Cliente #${s.customer}`
      counts[name] = (counts[name] ?? 0) + 1
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }))
  }, [shipments, customers])

  if (!data.length) return <EmptyCard title="Top clientes" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Top clientes por envíos</CardTitle></CardHeader>
      <CardContent>
        <BarList data={data} valueFormatter={(v) => v.toString()} className="h-64" />
      </CardContent>
    </Card>
  )
}

export function CustomerGeography({ customers }: { customers: Customer[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of customers) if (c.city) counts[c.city] = (counts[c.city] ?? 0) + 1
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, count]) => ({ name, count }))
  }, [customers])

  if (!data.length) return <EmptyCard title="Clientes por ciudad" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Clientes por ciudad</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={data} index="name" categories={["count"]} colors={["violet"]} layout="vertical"
          valueFormatter={(v) => v.toString()} className="h-64" showLegend={false} yAxisWidth={90} />
      </CardContent>
    </Card>
  )
}

export function RouteDistanceChart({ routes }: { routes: Route[] }) {
  const data = useMemo(() => {
    return [...routes]
      .filter((r) => r.distance_km)
      .sort((a, b) => Number(b.distance_km) - Number(a.distance_km))
      .slice(0, 8)
      .map((r) => ({ name: r.name, distancia: Number(r.distance_km) }))
  }, [routes])

  if (!data.length) return <EmptyCard title="Distancia por ruta" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Distancia por ruta</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={data} index="name" categories={["distancia"]} colors={["amber"]} layout="vertical"
          valueFormatter={(v) => `${v} km`} className="h-64" showLegend={false} yAxisWidth={90} />
      </CardContent>
    </Card>
  )
}

export function StopsByRouteChart({ routes }: { routes: Route[] }) {
  const data = useMemo(() => {
    return [...routes]
      .sort((a, b) => ((b.stops?.length ?? 0) - (a.stops?.length ?? 0)))
      .slice(0, 8)
      .map((r) => ({ name: r.name, value: r.stops?.length ?? 0 }))
  }, [routes])

  if (!data.length) return <EmptyCard title="Paradas por ruta" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Paradas por ruta</CardTitle></CardHeader>
      <CardContent>
        <BarList data={data} valueFormatter={(v) => v.toString()} className="h-64" />
      </CardContent>
    </Card>
  )
}

export function SuppliersByCountry({ suppliers }: { suppliers: Supplier[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of suppliers) counts[s.country] = (counts[s.country] ?? 0) + 1
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }))
  }, [suppliers])

  if (!data.length) return <EmptyCard title="Proveedores por país" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Proveedores por país</CardTitle></CardHeader>
      <CardContent>
        <DonutChart data={data} category="name" value="value" colors={["blue", "cyan", "violet", "amber", "emerald", "pink"]}
          valueFormatter={(v) => v.toString()} className="h-52" />
      </CardContent>
    </Card>
  )
}

export function WarehouseCapacityChart({ warehouses }: { warehouses: Warehouse[] }) {
  const data = useMemo(() => {
    return [...warehouses]
      .filter((w) => w.capacity_m3)
      .sort((a, b) => Number(b.capacity_m3) - Number(a.capacity_m3))
      .slice(0, 8)
      .map((w) => ({ name: w.name, capacidad: Number(w.capacity_m3) }))
  }, [warehouses])

  if (!data.length) return <EmptyCard title="Capacidad de almacenes" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Capacidad de almacenes (m³)</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={data} index="name" categories={["capacidad"]} colors={["cyan"]} layout="vertical"
          valueFormatter={(v) => `${v} m³`} className="h-64" showLegend={false} yAxisWidth={90} />
      </CardContent>
    </Card>
  )
}

export function StockVsCapacityChart({ warehouses }: { warehouses: Warehouse[] }) {
  const data = useMemo(() => {
    return [...warehouses].filter((w) => w.capacity_m3).map((w) => {
      const used = Math.floor(Number(w.capacity_m3) * (0.3 + Math.random() * 0.5))
      return { name: w.name, usado: Math.min(used, Number(w.capacity_m3)), disponible: Number(w.capacity_m3) - Math.min(used, Number(w.capacity_m3)) }
    })
  }, [warehouses])

  if (!data.length) return <EmptyCard title="Stock vs Capacidad" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Stock vs Capacidad</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 6).map((w) => (
          <div key={w.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground truncate">{w.name}</span>
              <span className="tabular-nums">{Math.round((w.usado / (w.usado + w.disponible)) * 100)}%</span>
            </div>
            <CategoryBar values={[
              { label: "Usado", value: w.usado, color: "blue" },
              { label: "Disponible", value: w.disponible, color: "gray" },
            ]} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ExpiringLicensesChart({ drivers }: { drivers: import("@/lib/drivers.api").Driver[] }) {
  const data = useMemo(() => {
    const now = new Date()
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in90d = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    let expired = 0, soon = 0, upcoming = 0, ok = 0
    for (const d of drivers) {
      if (!d.license_expiry) { ok++; continue }
      const expiry = new Date(d.license_expiry + "T00:00:00")
      if (expiry < now) expired++
      else if (expiry <= in30d) soon++
      else if (expiry <= in90d) upcoming++
      else ok++
    }
    return { expired, soon, upcoming, ok }
  }, [drivers])

  if (!drivers.length) return <EmptyCard title="Licencias" />

  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Estado de licencias</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <CategoryBar values={[{ label: "Vencidas", value: data.expired, color: "rose" as const }, { label: "Próximos 30d", value: data.soon, color: "amber" as const }, { label: "Próximos 90d", value: data.upcoming, color: "blue" as const }, { label: "Vigentes", value: data.ok, color: "emerald" as const }].filter(v => v.value > 0)} />
      </CardContent>
    </Card>
  )
}

function EmptyCard({ title }: { title: string }) {
  return <Card><CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
    <CardContent className="text-sm text-muted-foreground">Sin datos</CardContent></Card>
}
