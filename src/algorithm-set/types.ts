/**
 * Normalised algorithm-set document types (schemaVersion 1).
 * Vocabulary: CONTEXT.md; authoring contract: schema/README.md.
 */

export const SCHEMA_VERSION = 1 as const;

export type ColourToken =
  | "white"
  | "yellow"
  | "red"
  | "orange"
  | "blue"
  | "green";

export type Face = "U" | "D" | "F" | "B" | "L" | "R";

export type ColourScheme = Record<Face, ColourToken>;

/** Canonical stage ids after import normalisation. */
export type CanonicalStage =
  | "none"
  | "f2l"
  | "cross"
  | "first_layer"
  | "oll"
  | "pll"
  | "ll"
  | "cll"
  | "ell";

export type CompletionFlag = 0 | 1;

export type CaseFilter = "all" | "incomplete" | "complete";

export interface CaseLink {
  label: string;
  url: string;
}

export interface Mask {
  U?: number[];
  D?: number[];
  F?: number[];
  B?: number[];
  L?: number[];
  R?: number[];
}

export interface Angle {
  id: string;
  solutions: string[];
  /** Always 0 or 1 in-memory; omit on wire → 0. */
  completed: CompletionFlag;
}

export interface Case {
  id: string;
  name: string;
  setup: string;
  stage?: CanonicalStage;
  mask?: Mask;
  links?: CaseLink[];
  angles: Angle[];
}

/** Category list thumbnail; UI may render as silhouette (grey + light stickers). */
export interface CategoryIcon {
  setup: string;
  stage?: CanonicalStage;
}

export interface Category {
  id: string;
  name: string;
  /** Optional; place after id/name in authored JSON. */
  icon?: CategoryIcon;
  cases: Case[];
}

export interface AlgorithmSetDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  stage?: CanonicalStage;
  colourScheme?: ColourScheme;
  categories: Category[];
}

export interface ParseError {
  path: string;
  message: string;
}

export type ParseResult =
  | { ok: true; document: AlgorithmSetDocument }
  | { ok: false; errors: ParseError[] };
