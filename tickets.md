# Tickets: Cubing alg visualiser v1

**Main issue (epic + sub-issues):** https://github.com/rohanod/cubing-alg-visualiser/issues/7  

**Spec:** `docs/spec/v1.md`

Work the **frontier**: open sub-issues whose blockers are all closed.

## Label vocabulary

| Label | Meaning |
|-------|---------|
| `wayfinder:map` | Epic / map parent |
| `wayfinder:research` | AFK research (docs, inventory, third-party APIs) |
| `wayfinder:prototype` | Cheap concrete artifact to learn/validate |
| `wayfinder:grilling` | HITL decision grilling (none open — grill already done) |
| `wayfinder:task` | Implementation / delivery work |
| `ready-for-agent` | Agent-grabbable tracer bullet |
| `type:docs` | Docs / schema / authoring |
| `type:infra` | Scaffold, CI, PWA, deploy |
| `type:domain` | Algorithm-set logic & tests |
| `type:ui` | Product UI / layout / chrome |
| `type:visual` | Cube visualisation |
| `type:polish` | A11y / responsive QA |

## Dependency graph

```
#20 docs ────────────────────────────────────────────┐
#8 schema ──┐                                        │
#9 scaffold ┼─► #11 service ─► #12 import ─► #13 browse ┬─► #14 complete ─► #15 persist ─┐
            └─► #10 vendor ──────────────────────────┘   └─► #16 cube ──────────────────┼─► #17 PWA ─► #18 Pages
                                                                                         └────────────► #19 polish
```

## Sub-issues

| # | Title | Wayfinder | Area | Blocked by |
|---|--------|-----------|------|------------|
| [#20](https://github.com/rohanod/cubing-alg-visualiser/issues/20) | Commit product docs baseline | task | docs | — |
| [#8](https://github.com/rohanod/cubing-alg-visualiser/issues/8) | Authoring contract | task | docs | — |
| [#9](https://github.com/rohanod/cubing-alg-visualiser/issues/9) | Scaffold Bun Vite React TS | task | infra | — |
| [#10](https://github.com/rohanod/cubing-alg-visualiser/issues/10) | Vendor apps-sdk-ui + theme | research + task | ui | #9 |
| [#11](https://github.com/rohanod/cubing-alg-visualiser/issues/11) | Document service + tests | task | domain | #8, #9 |
| [#12](https://github.com/rohanod/cubing-alg-visualiser/issues/12) | Empty-state import | task | ui | #10, #11 |
| [#13](https://github.com/rohanod/cubing-alg-visualiser/issues/13) | Browse layout A (text) | task | ui | #12 |
| [#14](https://github.com/rohanod/cubing-alg-visualiser/issues/14) | Dual completion + filter | task | ui + domain | #13 |
| [#15](https://github.com/rohanod/cubing-alg-visualiser/issues/15) | Persistence + export | task | domain | #14 |
| [#16](https://github.com/rohanod/cubing-alg-visualiser/issues/16) | Case cube visual | prototype + task | visual | #13 |
| [#17](https://github.com/rohanod/cubing-alg-visualiser/issues/17) | Installable PWA | task | infra | #10, #15 |
| [#18](https://github.com/rohanod/cubing-alg-visualiser/issues/18) | GitHub Pages + Bun Actions | task | infra | #16, #17 |
| [#19](https://github.com/rohanod/cubing-alg-visualiser/issues/19) | Responsive + a11y polish | task | polish + ui | #14, #16, #17 |

## Superseded

#1–#6 closed (coarse first pass).

## Frontier now

- #20 Commit product docs baseline  
- #9 Scaffold app  
- (#8 Authoring contract — done: `schema/`)  

