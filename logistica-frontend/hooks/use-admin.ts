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
  getMe,
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

// ---------- Me ----------

export function useMe() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  })
}
