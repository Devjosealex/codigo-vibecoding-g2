"use client"

import { useMemo } from "react"
import { BarChart, DonutChart, BarList, ProgressCircle } from "@/components/tremor"
import type { Product } from "@/lib/products.api"
import type { Supplier } from "@/lib/suppliers.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StockByWarehouseChart({ products, warehouseNames: wm }: { products: Product[]; warehouseNames: Record<number, string> }) {
  const data = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const p of products) {
      const key = p.warehouse ? (wm[p.warehouse] ?? `Almacén #${p.warehouse}`) : "Sin almacén"
      acc[key] = (acc[key] ?? 0) + p.stock_quantity
    }
    return Object.entries(acc).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, stock]) => ({ name, stock }))
  }, [products, wm])

  if (!data.length) return <EmptyCard title="Stock por almacén" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Stock por almacén</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={data} index="name" categories={["stock"]} colors={["emerald"]} layout="vertical"
          valueFormatter={(v) => v.toString()} className="h-64" showLegend={false} yAxisWidth={90} />
      </CardContent>
    </Card>
  )
}

export function InventoryValueChart({ products, warehouseNames: wm }: { products: Product[]; warehouseNames: Record<number, string> }) {
  const data = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const p of products) {
      const key = p.warehouse ? (wm[p.warehouse] ?? `Almacén #${p.warehouse}`) : "Sin almacén"
      acc[key] = (acc[key] ?? 0) + p.stock_quantity * Number(p.unit_price)
    }
    return Object.entries(acc).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, total]) => ({ name, total }))
  }, [products, wm])

  if (!data.length) return <EmptyCard title="Valor de inventario" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Valor de inventario x almacén</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={data} index="name" categories={["total"]} colors={["violet"]} layout="vertical"
          valueFormatter={(v) => `S/ ${v.toFixed(2)}`} className="h-64" showLegend={false} yAxisWidth={90} />
      </CardContent>
    </Card>
  )
}

export function TopProductsChart({ products }: { products: Product[] }) {
  const data = useMemo(() => {
    return [...products]
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 10)
      .map((p) => ({ name: p.name, value: p.stock_quantity, href: `/products/${p.id}` }))
  }, [products])

  if (!data.length) return <EmptyCard title="Top productos" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Top productos por stock</CardTitle></CardHeader>
      <CardContent>
        <BarList data={data} valueFormatter={(v) => v.toString()} className="h-64" />
      </CardContent>
    </Card>
  )
}

export function ProductsBySupplierChart({ products, suppliers }: { products: Product[]; suppliers: Supplier[] }) {
  const data = useMemo(() => {
    const supMap = new Map(suppliers.map((s) => [s.id, s.name]))
    const counts: Record<string, number> = {}
    for (const p of products) {
      if (!p.supplier) { counts["Sin proveedor"] = (counts["Sin proveedor"] ?? 0) + 1; continue }
      const name = supMap.get(p.supplier) ?? `Proveedor #${p.supplier}`
      counts[name] = (counts[name] ?? 0) + 1
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }))
  }, [products, suppliers])

  if (!data.length) return <EmptyCard title="Productos x proveedor" />
  return (
    <Card><CardHeader><CardTitle className="text-sm font-medium">Productos por proveedor</CardTitle></CardHeader>
      <CardContent>
        <DonutChart data={data} category="name" value="value" colors={["blue", "cyan", "violet", "amber", "emerald", "pink"]}
          valueFormatter={(v) => v.toString()} className="h-52" />
      </CardContent>
    </Card>
  )
}

export function ProductStatsCards({ products }: { products: Product[] }) {
  const stats = useMemo(() => {
    const active = products.filter((p) => p.is_active).length
    const totalValue = products.reduce((s, p) => s + p.stock_quantity * Number(p.unit_price), 0)
    return { total: products.length, active, inactive: products.length - active, totalValue }
  }, [products])

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total productos</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold tabular-nums">{stats.total}</p></CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Valor total</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold tabular-nums">S/ {stats.totalValue.toFixed(2)}</p></CardContent>
      </Card>
      <Card className="flex items-center gap-4 col-span-2">
        <CardContent className="pt-6">
          <ProgressCircle value={stats.active} max={stats.total || 1} size="md" color="emerald" />
        </CardContent>
        <div>
          <p className="text-sm font-medium">Productos activos</p>
          <p className="text-xs text-muted-foreground">{stats.active} de {stats.total}</p>
        </div>
      </Card>
    </div>
  )
}

function EmptyCard({ title }: { title: string }) {
  return <Card><CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
    <CardContent className="text-sm text-muted-foreground">Sin datos</CardContent></Card>
}
