# Inventory apps-sdk-ui vendoring

**Status:** done  
**Type:** `wayfinder:research` (AFK)  
**Blocked by:** none  
**Delivered with:** GitHub #10 (vendor + system theme chrome)

## Question

Which files from [openai/apps-sdk-ui](https://github.com/openai/apps-sdk-ui) do we copy (components, icons, design tokens, peer deps/CSS), and where do they live under `src/` so the app does not npm-install that package?

## Done when

- [x] Short inventory markdown under `docs/notes/` (paths to copy, runtime deps like React, CSS entry) → `docs/notes/apps-sdk-ui-vendoring.md`
- [x] Explicit “do not copy” list (demos, docs site, unused components)
- [x] Resolution note + map pointer

## Resolution

Vendored under `src/vendor/apps-sdk-ui/` (tokens, icons, v1 component set). No `@openai/apps-sdk-ui` in dependencies. See inventory note for refresh steps.