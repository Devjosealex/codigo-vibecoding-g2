"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getAllCustomers,
  getAllSuppliers,
  getAllWarehouses,
  getAllProducts,
  getAllDrivers,
  getAllVehicles,
  getAllRoutes,
  getAllShipments,
} from "@/lib/dashboard.api"

export function useDashboardData() {
  const customers = useQuery({
    queryKey: ["dashboard-customers"],
    queryFn: getAllCustomers,
  })
  const suppliers = useQuery({
    queryKey: ["dashboard-suppliers"],
    queryFn: getAllSuppliers,
  })
  const warehouses = useQuery({
    queryKey: ["dashboard-warehouses"],
    queryFn: getAllWarehouses,
  })
  const products = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: getAllProducts,
  })
  const drivers = useQuery({
    queryKey: ["dashboard-drivers"],
    queryFn: getAllDrivers,
  })
  const vehicles = useQuery({
    queryKey: ["dashboard-vehicles"],
    queryFn: getAllVehicles,
  })
  const routes = useQuery({
    queryKey: ["dashboard-routes"],
    queryFn: getAllRoutes,
  })
  const shipments = useQuery({
    queryKey: ["dashboard-shipments"],
    queryFn: getAllShipments,
  })

  return {
    customers,
    suppliers,
    warehouses,
    products,
    drivers,
    vehicles,
    routes,
    shipments,
    isFetching:
      customers.isFetching ||
      suppliers.isFetching ||
      warehouses.isFetching ||
      products.isFetching ||
      drivers.isFetching ||
      vehicles.isFetching ||
      routes.isFetching ||
      shipments.isFetching,
  }
}
