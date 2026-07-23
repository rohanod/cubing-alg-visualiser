# Algorithm-set authoring contract (schemaVersion 1)

This folder is the **authoring contract** for portable **algorithm set** JSON: another human or AI can generate valid documents without reverse-engineering the app.

| File | Role |
|------|------|
| [`algorithm-set.schema.json`](./algorithm-set.schema.json) | JSON Schema (Draft 2020-12) |
| [`examples/minimal.json`](./examples/minimal.json) | Tiny valid example (2 cases, sparse angles) |
| This README | Field meanings, stages, completion, colour defaults |

**Vocabulary:** repo root [`CONTEXT.md`](../CONTEXT.md)  
**Product / UI behaviour:** [`docs/spec/v1.md`](../docs/spec/v1.md)  
**Reference PDF only:** [`Cube Academy Free F2L.pdf`](../Cube%20Academy%20Free%20F2L.pdf) — human/AI transcription aid; **never** loaded by the app runtime. Do not ship full Free F2L content as default app data.

---

## Document shape

```text
Algorithm set
├── schemaVersion: 1          (integer only; not "1")
├── id, name
├── stage?                    (set default mask)
├── colourScheme?             (all six faces if present)
└── categories[]              (≥1)
    ├── id, name
    ├── icon?                 (list thumbnail; after id/name)
    │   ├── setup             (representative shape alg)
    │   └── stage?            (optional; omit for silhouette list icons)
    └── cases[]               (≥1)
        ├── id, name, setup   (setup minLength 1)
        ├── stage?, mask?, links?
        └── angles[]          (≥1)
            ├── id            (display label)
            ├── solutions[]   (≥1 non-empty strings)
            └── completed?    (0 | 1; omit → 0)
```

Unknown properties are **rejected** (`additionalProperties: false`). Schema version 1 may evolve while it is pre-release; after it is declared stable, new fields require a future `schemaVersion`.

### Required vs optional

| Level | Required | Optional |
|-------|----------|----------|
| Set | `schemaVersion`, `id`, `name`, `categories` (≥1) | `stage`, `colourScheme` |
| Category | `id`, `name`, `cases` (≥1) | `icon` |
| Category icon | `setup` | `stage` |
| Case | `id`, `name`, `setup`, `angles` (≥1) | `stage`, `mask`, `links` |
| Angle | `id`, `solutions` (≥1) | `completed` |
| Link | `label`, `url` (URI) | — |

### Category `icon`

Optional object **near the top of each category** (after `id` / `name`, before `cases`). Used for small list thumbnails so a category is scannable without opening it.

| Field | Meaning |
|-------|---------|
| `setup` | Non-empty alg from the set base state to a **representative** cube shape for that category |
| `stage` | Optional stage mask for coloured previews; **omit** when the UI should show a **silhouette** (mostly grey, a few light stickers) |

**UI guidance (not enforced by schema):** category list rows use `icon` in silhouette style when present; case list rows can later show greys + real colours from each case’s own `setup` / `stage` (no separate case `icon` field required).

### Rejected edge cases

- Empty or missing `categories` / `cases` / `angles` / `solutions`
- Empty `setup` (`""`)
- Empty `solutions` array or empty solution strings
- `schemaVersion` other than integer `1` (including the string `"1"`)
- Boolean `completed` (`true`/`false`) — integers `0` and `1` only
- Extra keys at any object level
- Partial `colourScheme` (must list all of `U,D,F,B,L,R` or omit the property)
- Empty `mask` object `{}`
- Unknown `stage` after the rules below (e.g. `superoll`)

---

## IDs and uniqueness

- **Set `id`:** stable string used for browser storage and replace-on-reimport.
- **Uniqueness is within parent only:**
  - Category `id` unique within the set
  - Case `id` unique within its category (same case id in two categories is allowed)
  - Angle `id` unique within its case
- Future deep links can be hierarchical (`…/category-id/case-id`), not bare global `#case/dp5`.

JSON Schema does not enforce “unique by `id` field”; **generators and the app document service must**. Duplicate ids in a parent are invalid documents.

---

## Dual completion

- Only **angles** store completion: `completed` is `0` (incomplete) or `1` (complete).
- **Omit `completed` on import** → treat as `0`. **Export always writes** `0` or `1`.
- **Case complete** iff every defined angle has `completed === 1`.
- Multiple **solutions** on one angle are alternatives, not separate completion units.
- Cases need not define all four slot angles; free-form angle ids (`FR`, `front`, …).

---

## Colour scheme

**Independent of stage.** Applies sticker colours for diagrams.

- **Omit `colourScheme`** → **Cube Academy Free F2L PDF default:**  
  U yellow, D white, F blue, B green, L orange, R red.
- **If present:** all six faces required; each value is a **named token** only:

  `white` | `yellow` | `red` | `orange` | `blue` | `green`

No hex colours in schemaVersion 1.

---

## Stage and mask (visual greying)

**Independent of colour scheme.**

1. Resolve **colour scheme** (PDF default or override).
2. If case has raw **`mask`** → use it (wins over stage).
3. Else resolve **stage** (case override, else set default).
4. Known stage → app mask preset; `none` / omitted → **no mask** (full colour under the scheme).

### Canonical stage ids

Prefer these lowercase forms in authored JSON:

| Canonical | Meaning (app maps to a mask preset) |
|-----------|-------------------------------------|
| `none` | No mask (same as omitting `stage`) |
| `f2l` | F2L |
| `cross` | Cross |
| `first_layer` | First layer |
| `oll` | OLL |
| `pll` | PLL |
| `ll` | Last layer |
| `cll` | Corners of last layer |
| `ell` | Edges of last layer |

### Aliases and case (normalisation)

Import / validation pipeline:

1. Trim  
2. Lowercase  
3. Map aliases → canonical  
4. Accept only the canonical set above  
5. Reject anything else (e.g. `superoll`)

| Alias (after lowercase) | Canonical |
|-------------------------|-----------|
| `full` | `none` |
| `first-layer` | `first_layer` |
| `last_layer`, `last-layer` | `ll` |
| `coll` | `cll` |

Common casings such as `F2L`, `F2l`, `OLL` are listed in the JSON Schema enum so strict schema validators accept them without a pre-pass. The **app should still normalise to canonical** on import/export.

Export **should write canonical lowercase** stage ids.

---

## Raw `mask`

Optional advanced override on a **case**:

```json
"mask": {
  "U": [0, 1, 2],
  "F": [3, 4, 5]
}
```

- Keys: only `U` | `D` | `F` | `B` | `L` | `R`
- Values: non-empty arrays of non-negative sticker indices for that face
- At least one face required (no `{}`)
- When present, **overrides** stage for greying

---

## Links

Optional `links` on a case:

```json
"links": [{ "label": "Video", "url": "https://example.com/watch" }]
```

- Both `label` and `url` required and non-empty  
- `url` must be a URI  
- Empty `links: []` is allowed (same as omit)  
- App opens links externally; no embedded players in v1  

---

## Minimal example

See [`examples/minimal.json`](./examples/minimal.json):

- One category, two cases  
- Sparse angles (not always FR/FL/BL/BR)  
- One angle omits `completed` (→ 0)  
- One external link  
- Set-level `stage: "f2l"`  

### Validate the example

With [Ajv](https://ajv.js.org/) (Draft 2020-12) and formats:

```bash
bun install
bun run validate:schema
```

Or any Draft 2020-12 validator pointed at `algorithm-set.schema.json` + `examples/minimal.json`.

---

## Out of scope for this contract

- Full Free F2L algorithm content  
- Preferred-solution flags, per-solution notes  
- Boolean completion, hex colour schemes  
- Multi-set library documents (one set per file)  
- Runtime loading of the PDF  
