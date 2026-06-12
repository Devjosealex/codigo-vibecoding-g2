"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProfile,
  updateProfile,
  changePassword,
  type ProfileUpdateData,
  type ChangePasswordData,
} from "@/lib/profile.api"
import { toast } from "sonner"

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProfileUpdateData) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      queryClient.invalidateQueries({ queryKey: ["auth-me"] })
      toast.success("Perfil actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response?.data
              ?.detail
          : "Error al actualizar perfil"
      toast.error(msg || "Error al actualizar perfil")
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => changePassword(data),
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente")
    },
    onError: (error: unknown) => {
      const errData =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: Record<string, string[]> } }).response?.data
          : null
      if (errData) {
        const messages = Object.values(errData).flat().join(" ")
        toast.error(messages || "Error al cambiar contraseña")
      } else {
        toast.error("Error al cambiar contraseña")
      }
    },
  })
}
