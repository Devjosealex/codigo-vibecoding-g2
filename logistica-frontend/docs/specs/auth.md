# Spec: Auth

> Módulo base de autenticación JWT. Prerrequisito para todos los demás módulos.

## Endpoints a consumir

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | `/api/auth/token/` | `{ username, password }` | `{ access, refresh }` |
| POST | `/api/auth/token/refresh/` | `{ refresh }` | `{ access }` |

## Frontend pages/routes needed

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/login` | LoginPage | Formulario de login |
| `/dashboard` | DashboardPage | Dashboard protegido (placeholder) con redirect desde `/` |

**Protección**: Cualquier ruta que no sea `/login` debe redirigir a `/login` si no hay token.

## Components needed

- `components/auth/login-form.tsx` — Formulario con react-hook-form + zod
- `components/shared/sidebar.tsx` — Sidebar de navegación (protegido)
- `components/shared/header.tsx` — Header con info del usuario + logout
- `components/shared/auth-guard.tsx` — Componente que protege rutas

## Data layer

### API functions (`lib/auth.api.ts`)
```typescript
login(username: string, password: string): Promise<{ access: string; refresh: string }>
refreshToken(refresh: string): Promise<{ access: string }>
```

### Zustand store (`store/auth-store.ts`) — ya existe, verificar cubrimiento:
- `login(username, password)` → llama a API, guarda tokens
- `logout()` → limpia tokens, redirige a `/login`
- `initialize()` → lee tokens de localStorage al cargar
- `isAuthenticated` → boolean para guards

### Axios interceptor (`lib/api-client.ts`) — ya existe, verificar:
- Adjunta `Authorization: Bearer <access>` a cada request
- En 401 → intenta refresh; si falla → logout

## Validation rules (login form)

- `username`: required, string no vacío
- `password`: required, min 6 caracteres

## Acceptance criteria

- [x] Login page con formulario validado
- [x] Login exitoso guarda tokens y redirige a dashboard
- [x] Login fallido muestra error del backend
- [x] AuthGuard redirige a `/login` si no hay token
- [x] Header muestra nombre de usuario + botón logout
- [x] Sidebar con navegación (links placeholder para módulos futuros)
- [x] Logout limpia tokens y redirige a login
- [x] Refresh automático en 401 funciona
- [x] Layout protegido envuelve todas las páginas futuras
- [x] Build exitoso sin errores TypeScript

## Validation
✅ Todos los criterios verificados y pasando.
