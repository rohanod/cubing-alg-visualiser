import type { CanonicalStage } from "./types";

/**
 * After trim + lowercase, map aliases to canonical stage ids.
 * Unknown values are invalid (schema/README.md).
 */
const STAGE_ALIASES: Record<string, CanonicalStage> = {
  none: "none",
  full: "none",
  f2l: "f2l",
  cross: "cross",
  first_layer: "first_layer",
  "first-layer": "first_layer",
  oll: "oll",
  pll: "pll",
  ll: "ll",
  last_layer: "ll",
  "last-layer": "ll",
  cll: "cll",
  coll: "cll",
  ell: "ell",
};

export function normaliseStage(raw: string): CanonicalStage | null {
  const key = raw.trim().toLowerCase();
  return STAGE_ALIASES[key] ?? null;
}
