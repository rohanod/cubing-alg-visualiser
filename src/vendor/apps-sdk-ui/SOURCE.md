# Vendored from openai/apps-sdk-ui

- Upstream: https://github.com/openai/apps-sdk-ui
- Version: 0.2.2 (package.json)
- Commit: 0f00143c7a639906f1621fe58e1b6be7b5bea46d
- License: MIT (see LICENSE)
- Vendored as source under app control — not an npm dependency on `@openai/apps-sdk-ui`.

## Components

Full `src/components/` tree (stories/mdx/tests stripped). Refresh via:

```bash
cp -R ~/.explore/repos/openai__apps-sdk-ui/src/components/* src/vendor/apps-sdk-ui/components/
# strip stories/docs, re-expand mixins in *.module.css
```

## CSS

- `styles/`: PostCSS-processed foundations (tokens as `:root`, no Tailwind required).
- Component `*.module.css`: source-level nesting kept; `@mixin` / `spacing()` expanded locally so Vite can ship without the upstream PostCSS plugin pack.
- `lib/dateUtils.ts` omitted (luxon).
