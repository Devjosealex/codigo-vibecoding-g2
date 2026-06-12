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

// ---------- Me ----------

export async function getMe(): Promise<AdminUser> {
  const response = await apiClient.get<AdminUser>("/api/v1/auth/me/")
  return response.data
}
