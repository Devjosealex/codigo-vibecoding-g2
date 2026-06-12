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
import type { Product, ProductParams } from "@/lib/products.api"
import { useProducts, useDeleteProduct } from "@/hooks/use-products"
import { useProductSuppliers } from "@/hooks/use-products"
import { useProductWarehouses } from "@/hooks/use-products"
import { DataTableSortHeader } from "@/components/shared/data-table-sort-header"

const PAGE_SIZE = 20

export function ProductsTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: suppliers } = useProductSuppliers()
  const { data: warehouses } = useProductWarehouses()

  const params: ProductParams = {
    page,
    search: search || undefined,
    supplier: supplierFilter || undefined,
    warehouse: warehouseFilter || undefined,
    ordering: sorting.length
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : undefined,
  }

  const { data, isLoading, isError, error } = useProducts(params)
  const deleteMutation = useDeleteProduct()

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const supplierMap = useMemo(
    () => new Map((suppliers ?? []).map((s) => [s.id, s.name])),
    [suppliers],
  )
  const warehouseMap = useMemo(
    () => new Map((warehouses ?? []).map((w) => [w.id, w.name])),
    [warehouses],
  )

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
      },
      {
        accessorKey: "sku",
        header: "SKU",
      },
      {
        accessorKey: "supplier",
        header: "Proveedor",
        cell: ({ row }) =>
          row.original.supplier
            ? supplierMap.get(row.original.supplier) ?? `#${row.original.supplier}`
            : "—",
      },
      {
        accessorKey: "warehouse",
        header: "Almacén",
        cell: ({ row }) =>
          row.original.warehouse
            ? warehouseMap.get(row.original.warehouse) ??
              `#${row.original.warehouse}`
            : "—",
      },
      {
        accessorKey: "unit_price",
        header: "Precio",
        cell: ({ row }) =>
          `S/ ${Number(row.original.unit_price).toFixed(2)}`,
      },
      {
        accessorKey: "stock_quantity",
        header: "Stock",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Link href={`/products/${row.original.id}`}>
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
                  <DialogTitle>Eliminar producto</DialogTitle>
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
    [deleteId, deleteMutation, supplierMap, warehouseMap],
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
            placeholder="Buscar por nombre, SKU o descripción..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={supplierFilter}
          onValueChange={(v) => {
            setSupplierFilter(v === "all" ? "" : (v ?? ""))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(suppliers ?? []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={warehouseFilter}
          onValueChange={(v) => {
            setWarehouseFilter(v === "all" ? "" : (v ?? ""))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Almacén" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(warehouses ?? []).map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {(error as { message?: string })?.message ??
            "Error al cargar productos"}
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
                    No se encontraron productos
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
          {data ? `${data.count} producto(s)` : "—"}
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
