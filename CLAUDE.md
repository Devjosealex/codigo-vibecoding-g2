# Task Manager — Monorepo CLAUDE.md

Proyecto monorepo con dos subproyectos independientes que trabajan juntos:

```
codigo-vibecoding-g2/
├── task-manager-backend/   # API REST (Node.js + Express + Prisma)
├── task-manager-frontend/  # SPA (React + TypeScript + Vite)
└── logistica-api/          # Proyecto separado, ignorar en este contexto
```

---

## Stack

### Backend — `task-manager-backend/`
| Capa | Tecnología |
|---|---|
| Runtime | Node.js ESM (`"type": "module"`) |
| Framework | Express 4 |
| ORM | Prisma 7.2 con adapter `@prisma/adapter-pg` |
| Base de datos | PostgreSQL en **Neon** (cloud, no local) |
| Auth | bcrypt (hash) + uuid (token simple, no JWT) |
| Docs | Swagger (`/api-docs`) |
| Entrypoint | `src/index.js` → `node src/index.js` |
| Puerto | `3000` (hardcodeado en `src/index.js`) |

### Frontend — `task-manager-frontend/`
| Capa | Tecnología |
|---|---|
| Framework | React 19 |
| Lenguaje | TypeScript 6 |
| Build tool | Vite 8 |
| Estilos | Tailwind CSS v4 (plugin Vite) |
| Routing | React Router v7 |
| Iconos | Lucide React |
| Entrypoint | `src/main.tsx` → `npm run dev` |
| Puerto | `5173` (Vite default) |

---

## Arquitectura de comunicación

```
Frontend (localhost:5173)
    │
    │  fetch() HTTP/REST — sin autenticación activa
    ▼
Backend (localhost:3000)
    │
    │  Prisma ORM
    ▼
PostgreSQL Neon (cloud)
```

- Frontend llama al backend vía `fetch` nativo (no axios).
- URL base hardcodeada: `http://localhost:3000` (en dos lugares — ver Gaps).
- No hay autenticación en los endpoints actuales a pesar de que existe sistema de auth.
- CORS abierto (`origin: '*'`).

---

## Rutas del Backend

### Tareas — `/task`
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/task` | Listar todas las tareas |
| `POST` | `/task` | Crear tarea (`title` requerido, `description` opcional) |
| `GET` | `/task/:id` | Obtener tarea por id |
| `PUT` | `/task/:id` | Actualizar `title` y/o `description` |
| `DELETE` | `/task/:id` | Eliminar tarea |

### Auth — `/auth`
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registrar usuario (`name`, `lastname`, `email`, `password`) |
| `POST` | `/auth/login` | Login — devuelve `{ id, name, lastname, email, token }` |

### Docs
- `GET /api-docs` — Swagger UI

---

## Esquema de base de datos (Prisma)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  lastname  String
  email     String   @unique
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  tasks     Task[]
}

model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  userId      Int?     @map("user_id")  // relación opcional con User
  user        User?    @relation(...)
}
```

---

## Páginas del Frontend

| Ruta | Componente | Estado |
|---|---|---|
| `/` | `TaskList` | Funcional — lista, crea, edita, elimina, toggle completado |
| `/task/:id` | `TaskDetail` | Existe, funcionalidad a verificar |
| `/login` | `Login` | UI lista — `handleSubmit` solo hace `console.log`, no llama API |
| `/login-v2` | `Loginv2` | Variante de login, misma situación |

---

## Estructura de archivos clave

### Backend
```
src/
├── index.js              # Bootstrap Express, CORS, rutas
├── lib/prisma.js         # Singleton PrismaClient con adapter pg
├── tasks/
│   ├── routes.js         # Express Router para /task
│   └── controller.js     # Lógica CRUD con Prisma
├── users/
│   ├── routes.js         # Express Router para /auth
│   └── controller.js     # register + login con bcrypt/uuid
├── config/swagger.json   # Definición OpenAPI
└── generated/prisma/     # Generado por `prisma generate` — no editar
prisma/
└── schema.prisma         # Fuente de verdad del modelo de datos
```

### Frontend
```
src/
├── main.tsx              # ReactDOM.createRoot + BrowserRouter
├── App.tsx               # Definición de rutas
├── services/api.ts       # taskService — fetch wrapper para /task
├── types/Task.ts         # Interfaces TypeScript
├── pages/                # Componentes de página completa
└── components/           # Componentes reutilizables (Dialog, TaskForm, TaskItem)
```

---

## Gaps conocidos (deuda técnica)

> Documentar para no re-descubrir en cada sesión.

### Crítico
1. **`completed` no existe en DB** — El campo `completed` está en `types/Task.ts` y en la UI de `TaskList`, pero **no está en el schema Prisma**. El toggle de completado llama `taskService.update()` con `{ completed }` pero el backend ignora ese campo (no está en `updateTask`). Necesita migración.

2. **`id` es `Int` en DB pero `string` en TypeScript** — `Task.id` en frontend es `string`, pero Prisma devuelve `Int`. El backend hace `parseInt(id)` en cada operación. Potencial bug si el frontend envía valores no numéricos.

3. **Login no conectado** — `Login.tsx` y `Loginv2.tsx` no llaman al backend. El token devuelto por `/auth/login` no se almacena ni se envía en headers.

### Importante
4. **URL del backend duplicada** — `http://localhost:3000` está hardcodeada en `services/api.ts` Y también directamente en `pages/TaskList.tsx` (usa `fetch` directo, no `taskService`). Consolidar en variable de entorno Vite (`VITE_API_URL`).

5. **Rutas de tareas sin protección** — Cualquiera puede crear/editar/borrar tareas. `userId` en Task siempre es `null`. Falta middleware de auth.

6. **Token inseguro** — Auth usa `uuid()` como token. No es JWT, no expira, no se valida en el backend en ningún endpoint.

### Menor
7. **`TaskDetail.tsx`** — Existe pero no se verificó si llama a la API correctamente.
8. **Sin manejo de errores global** — Backend no tiene middleware de error centralizado.
9. **Sin variables de entorno en frontend** — No hay `.env` en frontend, todo hardcodeado.

---

## Comandos de desarrollo

### Backend
```bash
cd task-manager-backend
npm run dev        # node src/index.js (sin hot reload)
```

Variables de entorno requeridas (`.env`):
```
DATABASE_URL="postgresql://..."   # Neon connection string
```

### Frontend
```bash
cd task-manager-frontend
npm run dev        # Vite dev server en localhost:5173
npm run build      # tsc + vite build → dist/
npm run lint       # ESLint
```

### Prisma
```bash
cd task-manager-backend
npx prisma generate          # Regenerar cliente tras cambiar schema
npx prisma migrate dev       # Nueva migración
npx prisma studio            # GUI para inspeccionar DB
```

---

## Cómo trabajar features desde la raíz

Al crear una nueva feature que afecta ambos proyectos, dividir tareas así:

### Backend primero
1. Actualizar `prisma/schema.prisma`
2. Correr migración (`prisma migrate dev`)
3. Actualizar `controller.js` del módulo afectado
4. Actualizar `routes.js` si hay nuevos endpoints
5. Actualizar `src/config/swagger.json` si hay nuevos endpoints

### Frontend después
1. Actualizar `src/types/Task.ts` o crear nuevo tipo
2. Agregar método en `src/services/api.ts`
3. Actualizar/crear componente o página
4. Agregar ruta en `App.tsx` si es página nueva

### Regla general
- **Lógica de negocio y validaciones** → Backend
- **Estado de UI, formularios, navegación** → Frontend
- **Tipos compartidos** → definir en backend (schema Prisma) y replicar manualmente en `types/` del frontend

---

## Próximos pasos sugeridos (backlog técnico)

- [ ] Agregar campo `completed` al schema Prisma + migración
- [ ] Conectar Login al endpoint `/auth/login`
- [ ] Guardar token en `localStorage` y enviarlo en header `Authorization`
- [ ] Crear middleware de auth en backend que valide token
- [ ] Mover URL base del backend a `VITE_API_URL` en `.env` del frontend
- [ ] Eliminar uso directo de `fetch` en `TaskList.tsx` — usar `taskService`
- [ ] Agregar hot reload al backend (nodemon o `--watch`)
- [ ] Unificar tipo de `id` (string en frontend ↔ Int en DB)
