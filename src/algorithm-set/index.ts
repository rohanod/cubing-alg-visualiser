/**
 * Pure algorithm-set document service (schemaVersion 1).
 * No DOM / localStorage — primary unit-test seam per docs/spec/v1.md.
 */

export type {
  AlgorithmSetDocument,
  Angle,
  CanonicalStage,
  Case,
  CaseFilter,
  CaseLink,
  Category,
  ColourScheme,
  ColourToken,
  CompletionFlag,
  Face,
  Mask,
  ParseError,
  ParseResult,
} from "./types";
export { SCHEMA_VERSION } from "./types";

export { normaliseStage } from "./stages";

export {
  angleProgress,
  caseMatchesFilter,
  caseProgress,
  isCaseComplete,
  isCategoryComplete,
  isSetComplete,
  listCasesMatchingFilter,
  setAngleCompletion,
  toggleAngleCompletion,
} from "./completion";

export { parseAlgorithmSetDocument } from "./parse";

export {
  exportAlgorithmSetDocument,
  serializeAlgorithmSetDocument,
} from "./export";
