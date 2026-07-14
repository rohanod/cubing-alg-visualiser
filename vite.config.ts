import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Custom domain at site root — do not use /cubing-alg-visualiser/
// https://bun.com/docs/guides/ecosystem/vite
export default defineConfig({
  base: "/",
  plugins: [react()],
});
