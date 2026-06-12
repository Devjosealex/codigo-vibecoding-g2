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
import type { Shipment, ShipmentParams } from "@/lib/shipments.api"
import {
  useShipments,
  useDeleteShipment,
  useShipmentCustomers,
  useShipmentWarehouses,
} from "@/hooks/use-shipments"
import { ShipmentStatusBadge } from "./shipment-status-badge"
import { DataTableSortHeader } from "@/components/shared/data-table-sort-header"

const PAGE_SIZE = 20

export function ShipmentsTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: customers } = useShipmentCustomers()
  const { data: warehouses } = useShipmentWarehouses()

  const params: ShipmentParams = {
    page,
    search: search || undefined,
    status: statusFilter || undefined,
    ordering: sorting.length
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : undefined,
  }

  const { data, isLoading, isError, error } = useShipments(params)
  const deleteMutation = useDeleteShipment()

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const customerMap = useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c.name])),
    [customers],
  )
  const warehouseMap = useMemo(
    () => new Map((warehouses ?? []).map((w) => [w.id, w.name])),
    [warehouses],
  )

  const columns: ColumnDef<Shipment>[] = useMemo(
    () => [
      {
        accessorKey: "tracking_number",
        header: "Tracking",
      },
      {
        accessorKey: "customer",
        header: "Cliente",
        cell: ({ row }) =>
          row.original.customer
            ? customerMap.get(row.original.customer) ??
              `#${row.original.customer}`
            : "—",
      },
      {
        accessorKey: "destination_city",
        header: "Ciudad destino",
      },
      {
        accessorKey: "origin_warehouse",
        header: "Almacén origen",
        cell: ({ row }) =>
          row.original.origin_warehouse
            ? warehouseMap.get(row.original.origin_warehouse) ??
              `#${row.original.origin_warehouse}`
            : "—",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <ShipmentStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "base_cost",
        header: "Costo",
        cell: ({ row }) =>
          `S/ ${Number(row.original.base_cost).toFixed(2)}`,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Link href={`/shipments/${row.original.id}`}>
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
                  <DialogTitle>Eliminar envío</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de eliminar el envío{" "}
                    <strong>{row.original.tracking_number}</strong>?
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
    [deleteId, deleteMutation, customerMap, warehouseMap],
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
            placeholder="Buscar por tracking, ciudad o dirección..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : (v ?? ""))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="assigned">Asignado</SelectItem>
            <SelectItem value="in_transit">En tránsito</SelectItem>
            <SelectItem value="delivered">Entregado</SelectItem>
            <SelectItem value="returned">Devuelto</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {(error as { message?: string })?.message ??
            "Error al cargar envíos"}
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
                    {Array.from({ length: 7 }).map((_, j) => (
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
                    No se encontraron envíos
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
          {data ? `${data.count} envío(s)` : "—"}
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
