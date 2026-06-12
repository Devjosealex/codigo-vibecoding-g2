"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Search,
} from "lucide-react"
import type { Vehicle, VehicleParams } from "@/lib/vehicles.api"
import { useVehicles, useDeleteVehicle } from "@/hooks/use-vehicles"
import { useVehicleDrivers } from "@/hooks/use-vehicles"
import { DataTableSortHeader } from "@/components/shared/data-table-sort-header"

const PAGE_SIZE = 20

const vehicleTypeLabels: Record<string, string> = {
  truck: "Camión",
  van: "Camioneta",
  motorcycle: "Moto",
  other: "Otro",
}

export function VehiclesTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: drivers } = useVehicleDrivers()

  const params: VehicleParams = {
    page,
    search: search || undefined,
    vehicle_type: typeFilter || undefined,
    ordering: sorting.length
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : undefined,
  }

  const { data, isLoading, isError, error } = useVehicles(params)
  const deleteMutation = useDeleteVehicle()

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const driverMap = useMemo(
    () =>
      new Map(
        (drivers ?? []).map((d) => [
          d.id,
          `${d.first_name} ${d.last_name}`,
        ]),
      ),
    [drivers],
  )

  const columns: ColumnDef<Vehicle>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
      },
      {
        accessorKey: "plate_number",
        header: "Placa",
      },
      {
        accessorKey: "vehicle_type",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline">
            {vehicleTypeLabels[row.original.vehicle_type] ??
              row.original.vehicle_type}
          </Badge>
        ),
      },
      {
        accessorKey: "driver",
        header: "Conductor",
        cell: ({ row }) =>
          row.original.driver
            ? driverMap.get(row.original.driver) ?? `#${row.original.driver}`
            : "—",
      },
      {
        accessorKey: "capacity_kg",
        header: "Cap. (kg)",
        cell: ({ row }) =>
          row.original.capacity_kg
            ? `${Number(row.original.capacity_kg).toLocaleString()} kg`
            : "—",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Link href={`/vehicles/${row.original.id}`}>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Dialog
              open={deleteId === row.original.id}
              onOpenChange={(open) => {
                if (!open) setDeleteId(null)
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eliminar vehículo</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de eliminar{" "}
                    <strong>{row.original.name}</strong>? Esta acción es una
                    baja lógica.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      deleteMutation.mutate(row.original.id)
                      setDeleteId(null)
                    }}
                  >
                    {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ),
      },
    ],
    [deleteId, deleteMutation, driverMap],
  )

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o placa..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v === "all" ? "" : (v ?? ""))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="truck">Camión</SelectItem>
            <SelectItem value="van">Camioneta</SelectItem>
            <SelectItem value="motorcycle">Moto</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {(error as { message?: string })?.message ??
            "Error al cargar vehículos"}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                      }
                    >
                      <DataTableSortHeader header={header}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </DataTableSortHeader>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron vehículos
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.count} vehículo(s)` : "—"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {totalPages > 0 ? `${page} / ${totalPages}` : "—"}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
