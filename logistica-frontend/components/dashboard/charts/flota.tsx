"use client"

import { useMemo } from "react"
import { BarChart, DonutChart, ProgressCircle } from "@/components/tremor"
import type { Vehicle } from "@/lib/vehicles.api"
import type { Driver } from "@/lib/drivers.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const typeLabels: Record<string, string> = {
  truck: "Camión", van: "Camioneta", motorcycle: "Moto", other: "Otro",
}

export function FleetByTypeChart({ vehicles }: { vehicles: Vehicle[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of vehicles) counts[v.vehicle_type] = (counts[v.vehicle_type] ?? 0) + 1
    return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([type, value]) => ({ name: typeLabels[type] ?? type, value }))
  }, [vehicles])

  if (!data.length) return <EmptyCard title="Flota por tipo" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Flota por tipo</CardTitle></CardHeader>
      <CardContent>
        <div className="relative">
          <DonutChart data={data} category="name" value="value" colors={["blue", "cyan", "amber", "violet"]}
            valueFormatter={(v) => v.toString()} className="h-52" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold tabular-nums">{vehicles.length}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VehicleActiveRate({ vehicles }: { vehicles: Vehicle[] }) {
  const active = vehicles.filter((v) => v.is_active).length
  if (!vehicles.length) return <EmptyCard title="Vehículos activos" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Vehículos activos</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-4">
        <ProgressCircle value={active} max={vehicles.length} size="lg" color="emerald" />
        <div>
          <p className="text-2xl font-bold tabular-nums">{active}</p>
          <p className="text-xs text-muted-foreground">de {vehicles.length} vehículos</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function VehicleCapacityChart({ vehicles }: { vehicles: Vehicle[] }) {
  const data = useMemo(() => {
    return [...vehicles]
      .filter((v) => v.capacity_kg)
      .sort((a, b) => Number(b.capacity_kg) - Number(a.capacity_kg))
      .slice(0, 8)
      .map((v) => ({ name: v.name, capacidad: Number(v.capacity_kg) }))
  }, [vehicles])

  if (!data.length) return <EmptyCard title="Capacidad de carga" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Capacidad de carga (kg)</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={data} index="name" categories={["capacidad"]} colors={["orange"]} layout="vertical"
          valueFormatter={(v) => `${v} kg`} className="h-64" showLegend={false} yAxisWidth={90} />
      </CardContent>
    </Card>
  )
}

export function DriverActivityRate({ drivers }: { drivers: Driver[] }) {
  const stats = useMemo(() => {
    const active = drivers.filter((d) => d.is_active).length
    const withLicense = drivers.filter((d) => d.license_expiry).length
    return { active, inactive: drivers.length - active, total: drivers.length, withLicense }
  }, [drivers])

  if (!drivers.length) return <EmptyCard title="Conductores" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Conductores</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ProgressCircle value={stats.active} max={stats.total} size="lg" color={stats.active > stats.inactive ? "emerald" : "amber"} />
          <div>
            <p className="text-2xl font-bold tabular-nums">{stats.active}</p>
            <p className="text-xs text-muted-foreground">conductores activos</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border p-2"><p className="font-medium tabular-nums">{stats.inactive}</p><p className="text-muted-foreground">Inactivos</p></div>
          <div className="rounded-lg border p-2"><p className="font-medium tabular-nums">{stats.withLicense}</p><p className="text-muted-foreground">Con licencia</p></div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyCard({ title }: { title: string }) {
  return <Card><CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
    <CardContent className="text-sm text-muted-foreground">Sin datos</CardContent></Card>
}
