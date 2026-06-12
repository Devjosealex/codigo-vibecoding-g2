# frontend-admin — Spec de Implementación (Frontend Next.js 15)

> **Para agentes de implementación:** Leer `docs/backend-api-reference.md` antes de empezar. El backend debe tener el módulo `authentication` implementado y corriendo antes de integrar el frontend.

**Goal:** Agregar gestión de usuarios y grupos en el frontend para superadmins, incluyendo protección de rutas, link condicional en sidebar, y páginas CRUD completas.

**Architecture:** Se modifica `auth-store` para persistir `is_superuser`. Se crea `SuperAdminGuard` para proteger `/admin/*`. Se crean páginas en `app/(protected)/admin/` siguiendo el mismo patrón de tablas con TanStack Table ya establecido en `customers`, `suppliers`, etc.

**Tech Stack:** Next.js 15 App Router, Zustand, Axios (interceptor ya configurado en `lib/api-client.ts`), TanStack Query v5, TanStack Table v8, shadcn/ui (badge, button, card, dialog, input, label, select, skeleton, table), react-hook-form + zod, Lucide React.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `store/auth-store.ts` | MODIFICAR | Agregar `is_superuser` al tipo `User`; extraerlo del JWT en `login()` e `initialize()` |
| `types/admin.ts` | CREAR | Interfaces `AdminUser`, `AdminGroup`, `Permission`, `PaginatedResponse` |
| `lib/admin.api.ts` | CREAR | Funciones CRUD para users, groups, permissions |
| `hooks/use-admin.ts` | CREAR | Hooks TanStack Query para users, groups, permissions |
| `components/shared/auth-guard.tsx` | MODIFICAR | Agregar `SuperAdminGuard` al mismo archivo |
| `components/shared/sidebar.tsx` | MODIFICAR | Agregar link "Administración" condicional para superadmin |
| `components/admin/user-form.tsx` | CREAR | Formulario crear/editar usuario (react-hook-form + zod) |
| `components/admin/group-form.tsx` | CREAR | Formulario crear/editar grupo (react-hook-form + zod) |
| `components/admin/users-table.tsx` | CREAR | Tabla de usuarios con TanStack Table |
| `components/admin/groups-table.tsx` | CREAR | Tabla de grupos con TanStack Table |
| `app/(protected)/admin/layout.tsx` | CREAR | Layout que aplica `SuperAdminGuard` a todas las rutas `/admin/*` |
| `app/(protected)/admin/users/page.tsx` | CREAR | Página lista de usuarios |
| `app/(protected)/admin/users/new/page.tsx` | CREAR | Página crear usuario |
| `app/(protected)/admin/users/[id]/page.tsx` | CREAR | Página editar usuario |
| `app/(protected)/admin/groups/page.tsx` | CREAR | Página lista de grupos |
| `app/(protected)/admin/groups/new/page.tsx` | CREAR | Página crear grupo |
| `app/(protected)/admin/groups/[id]/page.tsx` | CREAR | Página editar grupo |

---

## Tarea 1 — Actualizar auth-store para persistir `is_superuser`

**Archivo:** `store/auth-store.ts`

### Paso 1: Reemplazar el contenido completo del archivo

```typescript
// store/auth-store.ts
import { create } from "zustand"
import { login as loginApi, decodeJwtPayload } from "@/lib/auth.api"

interface User {
  id: number
  username: string
  is_superuser: boolean
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  initialize: () => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("access_token")
    const userStr = localStorage.getItem("user")
    if (token && userStr) {
      try {
        const stored = JSON.parse(userStr)
        // Re-decode JWT para refrescar is_superuser desde el token actual
        const payload = decodeJwtPayload(token)
        const is_superuser = (payload?.is_superuser as boolean) ?? false
        set({
          isAuthenticated: true,
          user: { ...stored, is_superuser },
        })
      } catch {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
      }
    }
  },

  login: async (username: string, password: string) => {
    const data = await loginApi(username, password)
    localStorage.setItem("access_token", data.access)
    localStorage.setItem("refresh_token", data.refresh)

    const payload = decodeJwtPayload(data.access)
    const userId = (payload?.user_id as number) ?? 0
    const is_superuser = (payload?.is_superuser as boolean) ?? false
    const user: User = { id: userId, username, is_superuser }
    localStorage.setItem("user", JSON.stringify(user))
    set({ isAuthenticated: true, user })
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    set({ isAuthenticated: false, user: null })
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  },
}))
```

### Paso 2: Verificar que TypeScript compila sin errores

```bash
cd C:\Users\User\dev\codigo-vibecoding-g2\logistica-frontend
npx tsc --noEmit 2>&1 | head -30
```

Resultado esperado: sin errores relacionados con `auth-store.ts`.

---

## Tarea 2 — Tipos para admin

**Archivo:** `types/admin.ts`

### Paso 1: Crear el archivo

```typescript
// types/admin.ts
export interface Permission {
  id: number
  name: string
  codename: string
  content_type: number
}

export interface AdminGroup {
  id: number
  name: string
  permissions: Permission[]
}

export interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  groups: AdminGroup[]
  date_joined: string
  last_login: string | null
}

export interface AdminUserFormData {
  username: string
  email?: string
  first_name?: string
  last_name?: string
  password?: string
  is_active?: boolean
  is_staff?: boolean
  is_superuser?: boolean
}

export interface AdminGroupFormData {
  name: string
  permission_ids?: number[]
}

export interface PaginatedAdminResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

---

## Tarea 3 — API client para admin

**Archivo:** `lib/admin.api.ts`

### Paso 1: Crear el archivo

```typescript
// lib/admin.api.ts
import apiClient from "./api-client"
import type {
  AdminUser,
  AdminGroup,
  Permission,
  AdminUserFormData,
  AdminGroupFormData,
  PaginatedAdminResponse,
} from "@/types/admin"

// ---------- Users ----------

export interface UserParams {
  page?: number
  search?: string
  ordering?: string
}

export async function getUsers(
  params: UserParams = {},
): Promise<PaginatedAdminResponse<AdminUser>> {
  const response = await apiClient.get<PaginatedAdminResponse<AdminUser>>(
    "/api/v1/auth/users/",
    { params },
  )
  return response.data
}

export async function getUser(id: number): Promise<AdminUser> {
  const response = await apiClient.get<AdminUser>(`/api/v1/auth/users/${id}/`)
  return response.data
}

export async function createUser(data: AdminUserFormData): Promise<AdminUser> {
  const response = await apiClient.post<AdminUser>("/api/v1/auth/users/", data)
  return response.data
}

export async function updateUser(
  id: number,
  data: AdminUserFormData,
): Promise<AdminUser> {
  const response = await apiClient.put<AdminUser>(
    `/api/v1/auth/users/${id}/`,
    data,
  )
  return response.data
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/auth/users/${id}/`)
}

export async function setUserGroups(
  userId: number,
  groupIds: number[],
): Promise<AdminUser> {
  const response = await apiClient.post<AdminUser>(
    `/api/v1/auth/users/${userId}/set_groups/`,
    { group_ids: groupIds },
  )
  return response.data
}

// ---------- Groups ----------

export interface GroupParams {
  page?: number
  search?: string
  ordering?: string
}

export async function getGroups(
  params: GroupParams = {},
): Promise<PaginatedAdminResponse<AdminGroup>> {
  const response = await apiClient.get<PaginatedAdminResponse<AdminGroup>>(
    "/api/v1/auth/groups/",
    { params },
  )
  return response.data
}

export async function getGroup(id: number): Promise<AdminGroup> {
  const response = await apiClient.get<AdminGroup>(`/api/v1/auth/groups/${id}/`)
  return response.data
}

export async function createGroup(
  data: AdminGroupFormData,
): Promise<AdminGroup> {
  const response = await apiClient.post<AdminGroup>(
    "/api/v1/auth/groups/",
    data,
  )
  return response.data
}

export async function updateGroup(
  id: number,
  data: AdminGroupFormData,
): Promise<AdminGroup> {
  const response = await apiClient.put<AdminGroup>(
    `/api/v1/auth/groups/${id}/`,
    data,
  )
  return response.data
}

export async function deleteGroup(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/auth/groups/${id}/`)
}

// ---------- Permissions ----------

export async function getPermissions(): Promise<Permission[]> {
  const response = await apiClient.get<Permission[]>(
    "/api/v1/auth/permissions/",
  )
  return response.data
}
```

---

## Tarea 4 — Hooks TanStack Query para admin

**Archivo:** `hooks/use-admin.ts`

### Paso 1: Crear el archivo

```typescript
// hooks/use-admin.ts
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  setUserGroups,
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getPermissions,
  type UserParams,
  type GroupParams,
} from "@/lib/admin.api"
import type { AdminUserFormData, AdminGroupFormData } from "@/types/admin"
import { toast } from "sonner"

// ---------- Users ----------

export function useUsers(params: UserParams) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => getUsers(params),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["admin-users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUserFormData) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("Usuario creado correctamente")
    },
    onError: () => toast.error("Error al crear usuario"),
  })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUserFormData) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("Usuario actualizado correctamente")
    },
    onError: () => toast.error("Error al actualizar usuario"),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("Usuario eliminado correctamente")
    },
    onError: () => toast.error("Error al eliminar usuario"),
  })
}

export function useSetUserGroups(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupIds: number[]) => setUserGroups(userId, groupIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast.success("Grupos actualizados correctamente")
    },
    onError: () => toast.error("Error al asignar grupos"),
  })
}

// ---------- Groups ----------

export function useGroups(params: GroupParams) {
  return useQuery({
    queryKey: ["admin-groups", params],
    queryFn: () => getGroups(params),
  })
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: ["admin-groups", id],
    queryFn: () => getGroup(id),
    enabled: !!id,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminGroupFormData) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
      toast.success("Grupo creado correctamente")
    },
    onError: () => toast.error("Error al crear grupo"),
  })
}

export function useUpdateGroup(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminGroupFormData) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
      toast.success("Grupo actualizado correctamente")
    },
    onError: () => toast.error("Error al actualizar grupo"),
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
      toast.success("Grupo eliminado correctamente")
    },
    onError: () => toast.error("Error al eliminar grupo"),
  })
}

// ---------- Permissions ----------

export function usePermissions() {
  return useQuery({
    queryKey: ["admin-permissions"],
    queryFn: getPermissions,
  })
}
```

---

## Tarea 5 — SuperAdminGuard en auth-guard.tsx

**Archivo:** `components/shared/auth-guard.tsx`

### Paso 1: Agregar SuperAdminGuard al final del archivo existente

El archivo existente ya tiene `AuthGuard`. Agregar `SuperAdminGuard` a continuación:

```typescript
// Agregar al final de components/shared/auth-guard.tsx

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (!user?.is_superuser) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user?.is_superuser) {
    return null
  }

  return <>{children}</>
}
```

---

## Tarea 6 — Link "Administración" condicional en sidebar

**Archivo:** `components/shared/sidebar.tsx`

### Paso 1: Modificar el sidebar para leer `user` del store y mostrar link condicional

Cambios en el archivo:

1. Agregar import de `useAuthStore`
2. Definir `adminNavItem` separado de `navItems`
3. Renderizar el link de admin solo si `user?.is_superuser`

El archivo completo modificado:

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  Building2,
  Warehouse,
  Package,
  UserCircle,
  Truck,
  MapPin,
  ShipIcon,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react"
import { useUIStore } from "@/store/ui-store"
import { useAuthStore } from "@/store/auth-store"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Proveedores", href: "/suppliers", icon: Building2 },
  { label: "Almacenes", href: "/warehouses", icon: Warehouse },
  { label: "Productos", href: "/products", icon: Package },
  { label: "Conductores", href: "/drivers", icon: UserCircle },
  { label: "Vehículos", href: "/vehicles", icon: Truck },
  { label: "Rutas", href: "/routes", icon: MapPin },
  { label: "Envíos", href: "/shipments", icon: ShipIcon },
]

const adminNavItem = {
  label: "Administración",
  href: "/admin/users",
  icon: ShieldCheck,
}

export function Sidebar() {
  const pathname = usePathname()
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const user = useAuthStore((state) => state.user)

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const allNavItems = user?.is_superuser
    ? [...navItems, adminNavItem]
    : navItems

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
          sidebarOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar transition-transform duration-300 md:transition-all md:duration-300",
          "fixed inset-y-0 left-0 z-50 md:static md:z-auto",
          sidebarOpen
            ? "w-60 translate-x-0"
            : "w-60 -translate-x-full md:w-[60px] md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center border-b px-3.5 gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Truck className="h-3.5 w-3.5" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-sm tracking-tight" style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}>
              Logística
            </span>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
```

---

## Tarea 7 — Layout para rutas /admin/*

**Archivo:** `app/(protected)/admin/layout.tsx`

### Paso 1: Crear el archivo

```typescript
// app/(protected)/admin/layout.tsx
import { SuperAdminGuard } from "@/components/shared/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>
}
```

---

## Tarea 8 — Componentes de formulario: UserForm y GroupForm

### 8a — UserForm

**Archivo:** `components/admin/user-form.tsx`

```typescript
// components/admin/user-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateUser, useUpdateUser, useSetUserGroups, useGroups } from "@/hooks/use-admin"
import type { AdminUser } from "@/types/admin"

const userSchema = z.object({
  username: z.string().min(1, "El usuario es requerido").max(150),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  first_name: z.string().max(150).optional().or(z.literal("")),
  last_name: z.string().max(150).optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  is_staff: z.boolean().optional(),
  is_superuser: z.boolean().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  user?: AdminUser
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(user?.id ?? 0)
  const setGroupsMutation = useSetUserGroups(user?.id ?? 0)
  const isEditing = !!user

  const { data: groupsData } = useGroups({})
  const availableGroups = groupsData?.results ?? []

  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
    user?.groups.map((g) => g.id) ?? []
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          username: user.username,
          email: user.email ?? "",
          first_name: user.first_name ?? "",
          last_name: user.last_name ?? "",
          is_active: user.is_active,
          is_staff: user.is_staff,
          is_superuser: user.is_superuser,
        }
      : {
          is_active: true,
          is_staff: false,
          is_superuser: false,
        },
  })

  const isActive = watch("is_active")
  const isStaff = watch("is_staff")
  const isSuperuser = watch("is_superuser")

  function toggleGroup(id: number) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: UserFormValues) {
    const payload = {
      ...data,
      email: data.email || undefined,
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      password: data.password || undefined,
    }
    if (isEditing && user) {
      await updateMutation.mutateAsync(payload)
      await setGroupsMutation.mutateAsync(selectedGroupIds)
    } else {
      const created = await createMutation.mutateAsync(payload)
      if (selectedGroupIds.length > 0) {
        // setGroupsMutation hook uses user.id — for new users use direct API call
        const { setUserGroups } = await import("@/lib/admin.api")
        await setUserGroups(created.id, selectedGroupIds)
      }
    }
    router.push("/admin/users")
  }

  const isPending =
    createMutation.isPending || updateMutation.isPending || setGroupsMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario *</Label>
          <Input id="username" {...register("username")} />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input id="first_name" {...register("first_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido</Label>
          <Input id="last_name" {...register("last_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
          </Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Estado activo</Label>
          <Select
            value={isActive ? "true" : "false"}
            onValueChange={(v) => setValue("is_active", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Staff</Label>
          <Select
            value={isStaff ? "true" : "false"}
            onValueChange={(v) => setValue("is_staff", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Superadmin</Label>
          <Select
            value={isSuperuser ? "true" : "false"}
            onValueChange={(v) => setValue("is_superuser", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {availableGroups.length > 0 && (
        <div className="space-y-2">
          <Label>Grupos</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availableGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={selectedGroupIds.includes(group.id)}
                  onCheckedChange={() => toggleGroup(group.id)}
                />
                <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                  {group.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEditing ? "Actualizar usuario" : "Crear usuario"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

### 8b — GroupForm

**Archivo:** `components/admin/group-form.tsx`

```typescript
// components/admin/group-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateGroup, useUpdateGroup } from "@/hooks/use-admin"
import type { AdminGroup } from "@/types/admin"

const groupSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(150),
})

type GroupFormValues = z.infer<typeof groupSchema>

interface GroupFormProps {
  group?: AdminGroup
}

export function GroupForm({ group }: GroupFormProps) {
  const router = useRouter()
  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup(group?.id ?? 0)
  const isEditing = !!group

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: group ? { name: group.name } : {},
  })

  async function onSubmit(data: GroupFormValues) {
    if (isEditing && group) {
      await updateMutation.mutateAsync(data)
    } else {
      await createMutation.mutateAsync(data)
    }
    router.push("/admin/groups")
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 max-w-sm">
        <Label htmlFor="name">Nombre del grupo *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEditing ? "Actualizar grupo" : "Crear grupo"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/groups")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

---

## Tarea 9 — Tablas: UsersTable y GroupsTable

### 9a — UsersTable

**Archivo:** `components/admin/users-table.tsx`

```typescript
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
```

### 9b — GroupsTable

**Archivo:** `components/admin/groups-table.tsx`

```typescript
// components/admin/groups-table.tsx
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Search } from "lucide-react"
import type { AdminGroup } from "@/types/admin"
import { useGroups, useDeleteGroup } from "@/hooks/use-admin"

const PAGE_SIZE = 20

export function GroupsTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading, isError } = useGroups({
    page,
    search: search || undefined,
  })
  const deleteMutation = useDeleteGroup()
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const columns: ColumnDef<AdminGroup>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Nombre" },
      {
        id: "permissions_count",
        header: "Permisos",
        cell: ({ row }) => `${row.original.permissions.length} permiso(s)`,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Link href={`/admin/groups/${row.original.id}`}>
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
                  <DialogTitle>Eliminar grupo</DialogTitle>
                  <DialogDescription>
                    Eliminar el grupo <strong>{row.original.name}</strong>. Esta acción no se puede deshacer.
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
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          className="pl-8"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isError ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar grupos
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No se encontraron grupos
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
          {data ? `${data.count} grupo(s)` : "—"}
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
```

---

## Tarea 10 — Páginas de usuarios (/admin/users)

### 10a — Lista de usuarios

**Archivo:** `app/(protected)/admin/users/page.tsx`

```typescript
// app/(protected)/admin/users/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UsersTable } from "@/components/admin/users-table"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        </Link>
      </div>
      <UsersTable />
    </div>
  )
}
```

### 10b — Crear usuario

**Archivo:** `app/(protected)/admin/users/new/page.tsx`

```typescript
// app/(protected)/admin/users/new/page.tsx
import { UserForm } from "@/components/admin/user-form"

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nuevo usuario</h1>
      <UserForm />
    </div>
  )
}
```

### 10c — Editar usuario

**Archivo:** `app/(protected)/admin/users/[id]/page.tsx`

```typescript
// app/(protected)/admin/users/[id]/page.tsx
"use client"

import { use } from "react"
import { useUser } from "@/hooks/use-admin"
import { UserForm } from "@/components/admin/user-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: user, isLoading } = useUser(Number(id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar usuario: {user?.username}
      </h1>
      {user && <UserForm user={user} />}
    </div>
  )
}
```

---

## Tarea 11 — Páginas de grupos (/admin/groups)

### 11a — Lista de grupos

**Archivo:** `app/(protected)/admin/groups/page.tsx`

```typescript
// app/(protected)/admin/groups/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { GroupsTable } from "@/components/admin/groups-table"

export default function AdminGroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Grupos</h1>
        <Link href="/admin/groups/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo grupo
          </Button>
        </Link>
      </div>
      <GroupsTable />
    </div>
  )
}
```

### 11b — Crear grupo

**Archivo:** `app/(protected)/admin/groups/new/page.tsx`

```typescript
// app/(protected)/admin/groups/new/page.tsx
import { GroupForm } from "@/components/admin/group-form"

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nuevo grupo</h1>
      <GroupForm />
    </div>
  )
}
```

### 11c — Editar grupo

**Archivo:** `app/(protected)/admin/groups/[id]/page.tsx`

```typescript
// app/(protected)/admin/groups/[id]/page.tsx
"use client"

import { use } from "react"
import { useGroup } from "@/hooks/use-admin"
import { GroupForm } from "@/components/admin/group-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: group, isLoading } = useGroup(Number(id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar grupo: {group?.name}
      </h1>
      {group && <GroupForm group={group} />}
    </div>
  )
}
```

---

## Tarea 12 — Verificación final: TypeScript y lint

### Paso 1: Verificar TypeScript sin errores

```bash
cd C:\Users\User\dev\codigo-vibecoding-g2\logistica-frontend
npx tsc --noEmit
```

Resultado esperado: sin output (cero errores).

### Paso 2: Verificar ESLint sin errores

```bash
npm run lint
```

Resultado esperado: sin errores. Warnings menores son aceptables.

---

## Notas importantes

- `auth-guard.tsx` ya usa `"use client"` — `SuperAdminGuard` se agrega al mismo archivo sin directiva adicional.
- Next.js 15: los `params` en page components son `Promise<{...}>` — usar `use(params)` para unwrap en client components.
- El `AdminLayout` es minimal: solo aplica `SuperAdminGuard`. El `Sidebar` y `Header` vienen del layout padre `(protected)/layout.tsx`.
- `initialize()` en `auth-store` re-decodifica el JWT actual para refrescar `is_superuser` — esto garantiza que si se cambia el flag en el backend, se refleja al recargar la página.
- `types/admin.ts` no importa nada de `lib/` — evita dependencias circulares.
- La carpeta `components/admin/` se crea con los archivos de las Tareas 8 y 9 — no existe previamente.
