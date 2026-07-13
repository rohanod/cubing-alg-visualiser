# Freeze algorithm-set schema v1

**Status:** closed  
**Type:** `wayfinder:task` (AFK)  
**Blocked by:** none  
**GitHub:** #8  

## Question

What is the exact JSON Schema (schemaVersion **1**) for an algorithm-set document — required/optional fields, enums for stage aliases, completion shape, and a minimal valid example file for the authoring README?

## Done when

- [x] `schema/algorithm-set.schema.json` (or agreed path) exists and matches `CONTEXT.md`
- [x] Stage id list + alias rules documented
- [x] Tiny valid example JSON (1–2 cases) committed for generators
- [x] Resolution note on this ticket + link from map Decisions so far

## Resolution

Shipped under `schema/`:

- `algorithm-set.schema.json` — Draft 2020-12; `schemaVersion` const `1`; strict `additionalProperties: false`
- `README.md` — authoring contract (fields, dual completion, PDF colour default, stage canonical + aliases, mask, links)
- `examples/minimal.json` — 1 category, 2 cases, sparse angles
- `validate.ts` — Ajv check that the example validates

Grill freeze (summary): reject empty angles/solutions/categories/cases; non-empty setup; `completed` optional default 0; uniqueness within parent; stage closed set after casefold+alias (unknown reject); colour tokens only, full six faces if present; mask face→indices overrides stage; links label+uri; integer schemaVersion only.
