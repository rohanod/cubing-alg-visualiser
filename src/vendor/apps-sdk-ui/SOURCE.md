# Vendored from openai/apps-sdk-ui

- Upstream: https://github.com/openai/apps-sdk-ui
- Version: 0.2.2 (package.json)
- Commit: 0f00143c7a639906f1621fe58e1b6be7b5bea46d
- License: MIT (see LICENSE)
- Vendored as source under app control — not an npm dependency on `@openai/apps-sdk-ui`.

CSS under `styles/` and `**/*.module.css` is the PostCSS-processed form from the
upstream build (mixins/`spacing()` expanded, `light-dark()` expanded to
`[data-theme]` selectors). `@theme static` blocks were rewritten to plain
`:root` custom properties so this app does not need Tailwind at runtime.
