"use client"

import { useMemo, useState } from "react"
import { Building2, Package, Truck, ShipIcon, X, Loader2, Send, Users, Car } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCustomers } from "@/hooks/use-customers"
import { useProducts } from "@/hooks/use-products"
import { useVehicles } from "@/hooks/use-vehicles"
import { useShipments } from "@/hooks/use-shipments"
import { useDashboardData } from "@/hooks/use-dashboard"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import type { ShipmentStatus } from "@/lib/shipments.api"
import Link from "next/link"
import { parseISO, isWithinInterval } from "date-fns"

import {
  ShipmentsTrend, ShipmentsByStatus, RevenueMonthly, RevenueVsCost,
  DeliveryTimeChart, TopDestinationsChart, OnTimeRate,
  VolumeByWeekday, ShipmentsByOrigin, CostMarginTrend,
} from "@/components/dashboard/charts"
import {
  StockByWarehouseChart, InventoryValueChart, TopProductsChart,
  ProductsBySupplierChart, ProductStatsCards,
} from "@/components/dashboard/charts"
import {
  FleetByTypeChart, VehicleActiveRate, VehicleCapacityChart,
  DriverActivityRate,
} from "@/components/dashboard/charts"
import {
  CustomerTypeChart, TopCustomersChart, CustomerGeography,
  RouteDistanceChart, StopsByRouteChart,
  SuppliersByCountry, WarehouseCapacityChart, ExpiringLicensesChart,
} from "@/components/dashboard/charts"

const statusOptions: { value: ShipmentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "assigned", label: "Asignado" },
  { value: "in_transit", label: "En tránsito" },
  { value: "delivered", label: "Entregado" },
  { value: "returned", label: "Devuelto" },
  { value: "cancelled", label: "Cancelado" },
]

const tabs = [
  { id: "envios", label: "Envíos", icon: Send },
  { id: "productos", label: "Productos", icon: Package },
  { id: "flota", label: "Flota", icon: Truck },
  { id: "entidades", label: "Entidades", icon: Users },
] as const

type TabId = (typeof tabs)[number]["id"]

function filterShipments<T extends { created_at: string; status: string }>(
  shipments: T[],
  status: string,
  dateRange: DateRange | undefined,
): T[] {
  return shipments.filter((s) => {
    if (status !== "all" && s.status !== status) return false
    if (dateRange?.from && dateRange?.to) {
      const d = parseISO(s.created_at)
      if (!isWithinInterval(d, { start: dateRange.from, end: dateRange.to })) return false
    }
    return true
  })
}

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [activeTab, setActiveTab] = useState<TabId>("envios")

  const { data: customersData, isLoading: loadingCustomers } = useCustomers({})
  const { data: productsData, isLoading: loadingProducts } = useProducts({})
  const { data: vehiclesData, isLoading: loadingVehicles } = useVehicles({})
  const { data: shipmentsData, isLoading: loadingShipments } = useShipments({})

  const {
    customers: allCustomers,
    warehouses,
    drivers,
    products,
    vehicles,
    shipments,
    routes,
    suppliers,
    isFetching,
  } = useDashboardData()

  const filteredShipments = useMemo(
    () => filterShipments(shipments.data ?? [], statusFilter, dateRange),
    [shipments.data, statusFilter, dateRange],
  )

  const warehouseNameMap = useMemo(() => {
    if (!warehouses.data) return {}
    const map: Record<number, string> = {}
    for (const w of warehouses.data) map[w.id] = w.name
    return map
  }, [warehouses.data])

  const hasFilters = statusFilter !== "all" || dateRange?.from

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vista general del sistema logístico</p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Actualizando...
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/customers">
          <Card className="transition-all duration-200 hover:shadow-md cursor-pointer hover:-translate-y-px">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Clientes</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tabular-nums text-foreground">
                {loadingCustomers ? <span className="text-muted-foreground/30 text-2xl">—</span> : customersData?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total registrados</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/products">
          <Card className="transition-all duration-200 hover:shadow-md cursor-pointer hover:-translate-y-px">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Productos</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tabular-nums text-foreground">
                {loadingProducts ? <span className="text-muted-foreground/30 text-2xl">—</span> : productsData?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">En catálogo</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/vehicles">
          <Card className="transition-all duration-200 hover:shadow-md cursor-pointer hover:-translate-y-px">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vehículos</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
                <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tabular-nums text-foreground">
                {loadingVehicles ? <span className="text-muted-foreground/30 text-2xl">—</span> : vehiclesData?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Flota activa</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/shipments">
          <Card className="transition-all duration-200 hover:shadow-md cursor-pointer hover:-translate-y-px">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Envíos</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <ShipIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tabular-nums text-foreground">
                {loadingShipments ? <span className="text-muted-foreground/30 text-2xl">—</span> : shipmentsData?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total enviados</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[180px]">
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 sm:flex-none">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm"
            onClick={() => { setStatusFilter("all"); setDateRange(undefined) }}>
            <X className="mr-1 h-4 w-4" />Limpiar
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg border p-1 bg-muted/50">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === "envios" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><ShipmentsTrend shipments={filteredShipments} /></div>
            <ShipmentsByStatus shipments={filteredShipments} />
            <OnTimeRate shipments={filteredShipments} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><RevenueVsCost shipments={filteredShipments} /></div>
            <RevenueMonthly shipments={filteredShipments} />
            <CostMarginTrend shipments={filteredShipments} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DeliveryTimeChart shipments={filteredShipments} />
            <TopDestinationsChart shipments={filteredShipments} />
            <VolumeByWeekday shipments={filteredShipments} />
            <ShipmentsByOrigin shipments={filteredShipments} warehouses={warehouseNameMap} />
          </div>
        </div>
      )}

      {activeTab === "productos" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProductStatsCards products={products.data ?? []} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><StockByWarehouseChart products={products.data ?? []} warehouseNames={warehouseNameMap} /></div>
            <div className="lg:col-span-2"><InventoryValueChart products={products.data ?? []} warehouseNames={warehouseNameMap} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><TopProductsChart products={products.data ?? []} /></div>
            <ProductsBySupplierChart products={products.data ?? []} suppliers={suppliers.data ?? []} />
          </div>
        </div>
      )}

      {activeTab === "flota" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FleetByTypeChart vehicles={vehicles.data ?? []} />
            <VehicleActiveRate vehicles={vehicles.data ?? []} />
            <VehicleCapacityChart vehicles={vehicles.data ?? []} />
            <DriverActivityRate drivers={drivers.data ?? []} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><RouteDistanceChart routes={routes.data ?? []} /></div>
            <div className="lg:col-span-2"><StopsByRouteChart routes={routes.data ?? []} /></div>
          </div>
        </div>
      )}

      {activeTab === "entidades" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CustomerTypeChart customers={allCustomers.data ?? []} />
            <TopCustomersChart shipments={filteredShipments} customers={allCustomers.data ?? []} />
            <CustomerGeography customers={allCustomers.data ?? []} />
            <SuppliersByCountry suppliers={suppliers.data ?? []} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><WarehouseCapacityChart warehouses={warehouses.data ?? []} /></div>
            <ExpiringLicensesChart drivers={drivers.data ?? []} />
          </div>
        </div>
      )}
    </div>
  )
}
