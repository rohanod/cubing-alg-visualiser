# Wayfinder map: Cubing alg visualiser v1

**Canonical tracker epic:** https://github.com/rohanod/cubing-alg-visualiser/issues/7  
(sub-issues #8–#20, label `ready-for-agent` on children)

## Destination

v1 SPA/PWA on GitHub Pages: import/export algorithm sets with dual completion, layout A, static puzzle-gen visuals with stage masks, authoring schema for generators. Spec: `docs/spec/v1.md`.

## Notes

- Bun; CONTEXT.md; PRODUCT.md; impeccable adapt notes
- Execution is in scope via GitHub sub-issues under #7
- Work the frontier one ticket at a time

## Decisions so far

- Grill + domain model locked (see CONTEXT.md / MAP history)
- Spec published: `docs/spec/v1.md` (`ready-for-agent`)
- Coarse tickets #1–#6 superseded by #8–#20
- Epic #7 is parent with native GitHub sub-issues
- **Authoring contract frozen:** `schema/` (JSON Schema v1 + README + `examples/minimal.json`) — see #8 / `docs/wayfinder/tickets/freeze-algorithm-set-schema-v1.md`

## Frontier (open, unblocked)

- [#20 Commit product docs baseline](https://github.com/rohanod/cubing-alg-visualiser/issues/20)
- [#9 Scaffold app](https://github.com/rohanod/cubing-alg-visualiser/issues/9)

## Full sub-issue DAG

See epic body or root `tickets.md`.

## Out of scope

Full Free F2L JSON generation, Twisty, backend, text search, solution animation.
