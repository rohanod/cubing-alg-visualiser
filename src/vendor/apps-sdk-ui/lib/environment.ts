const META_ENV = typeof import.meta !== "undefined" ? import.meta.env : undefined

// Avoid direct `process` references (this app's TS config does not ambient-include Node).
const NODE_ENV =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process !== "undefined" &&
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV
    ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process!.env!.NODE_ENV!
    : "production"

export const isDev = NODE_ENV === "development" || !!META_ENV?.DEV

export const isJSDomLike =
  (typeof navigator !== "undefined" && /(jsdom|happy-dom)/i.test(navigator.userAgent)) ||
  typeof (globalThis as Record<string, unknown>).happyDOM === "object"

export const isTest = NODE_ENV === "test" || META_ENV?.MODE === "test" || isJSDomLike

export const hasWindow = typeof window !== "undefined"
export const hasDocument = typeof document !== "undefined"
export const canUseDOM = hasWindow && hasDocument
