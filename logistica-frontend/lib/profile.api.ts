import apiClient from "./api-client"

export interface Profile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
  last_login: string | null
}

export interface ProfileUpdateData {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

export async function getProfile(): Promise<Profile> {
  const response = await apiClient.get<Profile>("/api/v1/auth/me/")
  return response.data
}

export async function updateProfile(data: ProfileUpdateData): Promise<Profile> {
  const response = await apiClient.patch<Profile>("/api/v1/auth/me/", data)
  return response.data
}

export async function changePassword(data: ChangePasswordData): Promise<void> {
  await apiClient.post("/api/v1/auth/me/change_password/", data)
}
