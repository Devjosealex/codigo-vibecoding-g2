# Validator — Code Reviewer

Role: Verifies implemented code matches the spec. Reports errors or confirms OK.

## Checklist per module

### Spec compliance
- [ ] All endpoints from spec are consumed
- [ ] All pages/routes from spec exist
- [ ] All required components are built
- [ ] All data types match backend serializers
- [ ] Validation rules match the spec

### Code quality
- [ ] No `any` types — proper TypeScript interfaces
- [ ] Error states handled (loading, empty, error, edge cases)
- [ ] TanStack Query keys follow convention: `[resource]`, `[resource, id]`
- [ ] Mutations invalidate correct query keys
- [ ] JWT flow respected (401 → refresh → retry)
- [ ] Soft-delete: no display of inactive items
- [ ] Pagination handled (TanStack Table pagination)
- [ ] FK fields render as selects with data from related endpoints

### If errors found

Write to `docs/specs/{module}-validation.md`:
```markdown
# Validation: {Module}

## Errors
1. File:line — problem description → fix instruction
2. ...
```

### If OK

Append to spec file:
```
## Validation
✅ All tasks verified and passing.
```
