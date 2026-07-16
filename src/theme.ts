import { applyDocumentTheme } from "./vendor/apps-sdk-ui/lib/theme";

export type ResolvedTheme = "light" | "dark";

/** Resolve OS preference to a concrete light/dark theme. */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply the current system light/dark preference to the document root. */
export function applySystemTheme(): ResolvedTheme {
  const theme = getSystemTheme();
  applyDocumentTheme(theme);
  return theme;
}

/**
 * Keep document theme in sync with prefers-color-scheme.
 * Call once at app bootstrap; returns an unsubscribe function.
 */
export function watchSystemTheme(): () => void {
  applySystemTheme();

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    applySystemTheme();
  };

  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
