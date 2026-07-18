# Vendored from openai/apps-sdk-ui

- Upstream: https://github.com/openai/apps-sdk-ui
- Version: 0.2.2
- Commit: 0f00143c7a639906f1621fe58e1b6be7b5bea46d
- License: MIT (see LICENSE)
- Embedded in-repo (not an npm dependency on `@openai/apps-sdk-ui`).

## Layout

| Path | Source |
|------|--------|
| `styles/` | Published package `dist/es/styles` (exact tokens + `@theme` + Tailwind utilities) |
| `components/**/*.module.css` | Published package CSS modules |
| `components/**/*.tsx` | Upstream React source (stories/docs stripped) |
| `lib/`, `hooks/`, `types.ts` | Upstream source |

## App wiring (matches Installation docs)

```css
/* src/index.css */
@import "tailwindcss";
@import "./vendor/apps-sdk-ui/styles/index.css";
@source "./vendor/apps-sdk-ui";
```

```ts
// vite.config.ts
plugins: [react(), tailwindcss()]
```

Peer: `tailwindcss` ^4 + `@tailwindcss/vite`.
