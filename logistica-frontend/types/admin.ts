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
