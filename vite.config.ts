import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type ServerOptions } from "vite";

// Custom domain at site root — do not use /cubing-alg-visualiser/
// https://bun.com/docs/guides/ecosystem/vite
//
// Portless / other proxies set HOST and PORT — honour them for dev + preview.

function envHost(): string | boolean | undefined {
  const raw = process.env.HOST?.trim();
  if (!raw) return undefined; // Vite default (localhost)
  if (raw === "true" || raw === "0.0.0.0") return true;
  return raw;
}

function envPort(): number | undefined {
  const raw = process.env.PORT?.trim();
  if (!raw) return undefined; // Vite default (5173)
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const host = envHost();
const port = envPort();

const listen: ServerOptions = {
  ...(host !== undefined ? { host } : {}),
  ...(port !== undefined ? { port, strictPort: true } : {}),
};

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  server: listen,
  preview: listen,
});
