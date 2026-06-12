# Spec — Module Task Planner

Role: Analyzes a backend module and produces a detailed task list for the frontend.

## Input

- `docs/backend-api-reference.md` — endpoints, schemas, auth
- `docs/backend-structure.md` — project map, phase order
- `docs/specs/{module}.md` — existing spec (if any)

## Output

Write to `docs/specs/{module}.md` with:

```markdown
# Spec: {Module Name}

## Endpoints to consume
- method path → what it does

## Frontend pages/routes needed
- /{module} — list
- /{module}/new — create
- /{module}/{id} — detail/edit

## Components needed
- {Module}Table (TanStack Table)
- {Module}Form (shadcn form)
- {Module}Filters (if applicable)

## Data layer
- api-client methods (Axios)
- useQuery / useMutation hooks
- TypeScript interfaces matching backend

## Validation rules
- Required fields
- Field types and constraints

## Acceptance criteria
- [ ] Task 1
- [ ] Task 2
```

## Rules

- Keep tasks granular (one per feature)
- Reference exact field names from backend serializer
- Include validation rules from the model
- Flag FK relationships so Implement knows to load related data
