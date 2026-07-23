import type {
  AlgorithmSetDocument,
  Angle,
  Case,
  Category,
} from "./types";

/**
 * Serialise a normalised document for export.
 * - Always writes angle `completed` as 0 or 1 (never omits).
 * - Writes canonical lowercase stage ids.
 * - Same document shape as import.
 */
export function exportAlgorithmSetDocument(
  document: AlgorithmSetDocument,
): AlgorithmSetDocument {
  return {
    schemaVersion: document.schemaVersion,
    id: document.id,
    name: document.name,
    ...(document.stage !== undefined ? { stage: document.stage } : {}),
    ...(document.colourScheme !== undefined
      ? { colourScheme: { ...document.colourScheme } }
      : {}),
    categories: document.categories.map(exportCategory),
  };
}

export function serializeAlgorithmSetDocument(
  document: AlgorithmSetDocument,
): string {
  return `${JSON.stringify(exportAlgorithmSetDocument(document), null, 2)}\n`;
}

function exportCategory(category: Category): Category {
  return {
    id: category.id,
    name: category.name,
    ...(category.icon !== undefined
      ? { icon: { ...category.icon } }
      : {}),
    cases: category.cases.map(exportCase),
  };
}

function exportCase(caseItem: Case): Case {
  return {
    id: caseItem.id,
    name: caseItem.name,
    setup: caseItem.setup,
    ...(caseItem.stage !== undefined ? { stage: caseItem.stage } : {}),
    ...(caseItem.mask !== undefined
      ? { mask: structuredClone(caseItem.mask) }
      : {}),
    ...(caseItem.links !== undefined
      ? { links: caseItem.links.map((l) => ({ ...l })) }
      : {}),
    angles: caseItem.angles.map(exportAngle),
  };
}

function exportAngle(angle: Angle): Angle {
  return {
    id: angle.id,
    solutions: [...angle.solutions],
    completed: angle.completed === 1 ? 1 : 0,
  };
}
