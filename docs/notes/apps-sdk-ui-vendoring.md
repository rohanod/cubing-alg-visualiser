# Apps SDK UI vendoring inventory

**Status:** done (closes GitHub #10)  
**Upstream:** [openai/apps-sdk-ui](https://github.com/openai/apps-sdk-ui) v0.2.2 @ `0f00143`  
**Location in this repo:** `src/vendor/apps-sdk-ui/`  
**Runtime:** no npm dependency on `@openai/apps-sdk-ui` (see `package.json`).

## What was copied

| Area | Path | Notes |
|------|------|--------|
| Design tokens + foundations | `styles/` (`base`, `variables-primitive`, `variables-semantic`, `variables-components`, `globals`, `index`) | PostCSS-processed form: mixins/`spacing()` expanded, `light-dark()` expanded to `[data-theme]` selectors. `@theme static` rewritten to plain `:root` custom properties so Tailwind is not required at runtime. |
| Icons | `components/Icon/` (+ `svg/`) | Full icon set as React SVG components. |
| Components (v1 chrome + upcoming UI) | `AppsSDKUIProvider`, `Alert`, `Badge`, `Button`, `Checkbox`, `EmptyMessage`, `Indicator`, `Input`, `SegmentedControl`, `Textarea`, `TextLink`, `Transition` | Source TSX kept; CSS modules are the processed build output. |
| Shared types / globals | `types.ts`, `global.d.ts` | Size/color/variant unions and provider config. |
| Lib helpers | `lib/` (theme, helpers, environment, renderHelpers, …) | Omits `dateUtils` (luxon). |
| Hooks used by Indicator | `hooks/useSimulatedProgress.tsx` | Only what vendored components import. |
| License / pin | `LICENSE`, `SOURCE.md` | MIT + commit pin. |

## App wiring

- Token CSS imported from `src/index.css`.
- System light/dark: `data-theme` + `color-scheme` on `<html>` via inline boot script in `index.html` and `watchSystemTheme()` in `src/theme.ts` (`prefers-color-scheme`).
- Shared chrome: `src/App.tsx` uses vendored `EmptyMessage`, `Button`, and `Icon` against token surfaces (`--color-surface`, `--color-text`, …).

## Runtime peer-ish packages (not apps-sdk-ui)

Installed as normal app dependencies because components import them:

- `clsx`
- `react-merge-refs`
- `usehooks-ts`
- `radix-ui` (Checkbox, SegmentedControl)

## Explicit do-not-copy list

- Storybook (`.storybook-base`, `*.stories.tsx`, `*.mdx` docs)
- Unit tests (`*.test.*`)
- Sample markdown / KaTeX CSS
- Tailwind-only utilities (`tailwind-utilities.css`) and `@custom-variant` directives
- Heavy / unused product components for this app: `Markdown`, `CodeBlock`, `DatePicker`, `DateRangePicker`, `Menu`, `Popover`, `Tooltip`, `Select`, `SelectControl`, `Slider`, `Switch`, `RadioGroup`, `TagInput`, `Avatar`, `Image`, `ShimmerText`
- Upstream package build tooling (storybook, stylelint, package scripts)
- npm package `@openai/apps-sdk-ui` itself

## Import conventions

Prefer deep imports while working:

```ts
import { Button } from "./vendor/apps-sdk-ui/components/Button"
import { Archive } from "./vendor/apps-sdk-ui/components/Icon"
import { applyDocumentTheme } from "./vendor/apps-sdk-ui/lib/theme"
```

Optional barrel: `src/vendor/apps-sdk-ui/index.ts`.

## Refreshing the vendor tree

1. Clone/checkout upstream at a known commit.
2. Run their CSS PostCSS pipeline (`scripts/build-css.mjs`).
3. Re-copy the subsets listed above; re-apply `:root` rewrite for `@theme` and drop Tailwind directives.
4. Update `SOURCE.md` commit/version and this inventory if the surface area changes.
