// components/admin/users-table.tsx
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Search } from "lucide-react"
import type { AdminUser } from "@/types/admin"
import { useUsers, useDeleteUser } from "@/hooks/use-admin"
import { DataTableSortHeader } from "@/components/shared/data-table-sort-header"

const PAGE_SIZE = 20

export function UsersTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const params = {
    page,
    search: search || undefined,
    ordering: sorting.length
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : undefined,
  }

  const { data, isLoading, isError } = useUsers(params)
  const deleteMutation = useDeleteUser()
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      { accessorKey: "username", header: "Usuario" },
      { accessorKey: "email", header: "Email" },
      {
        id: "name",
        header: "Nombre",
        cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`.trim() || "—",
      },
      {
        accessorKey: "is_superuser",
        header: "Superadmin",
        cell: ({ row }) =>
          row.original.is_superuser ? (
            <Badge>Sí</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
      },
      {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="outline" className="text-green-600 border-green-600">Activo</Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-600">Inactivo</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Link href={`/admin/users/${row.original.id}`}>
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
              onOpenChange={(open) => { if (!open) setDeleteId(null) }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eliminar usuario</DialogTitle>
                  <DialogDescription>
                    Eliminar a <strong>{row.original.username}</strong>. Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
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
    [deleteId, deleteMutation],
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
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por usuario o email..."
          className="pl-8"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isError ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar usuarios
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                    >
                      <DataTableSortHeader header={header}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
          {data ? `${data.count} usuario(s)` : "—"}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {totalPages > 0 ? `${page} / ${totalPages}` : "—"}
          </span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
