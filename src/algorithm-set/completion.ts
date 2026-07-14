import type {
  AlgorithmSetDocument,
  Angle,
  Case,
  CaseFilter,
  Category,
  CompletionFlag,
} from "./types";

/** Case complete iff every defined angle has completed === 1. */
export function isCaseComplete(caseItem: Case): boolean {
  return caseItem.angles.every((a) => a.completed === 1);
}

export function isCategoryComplete(category: Category): boolean {
  return category.cases.every(isCaseComplete);
}

export function isSetComplete(document: AlgorithmSetDocument): boolean {
  return document.categories.every(isCategoryComplete);
}

export function caseMatchesFilter(
  caseItem: Case,
  filter: CaseFilter,
): boolean {
  if (filter === "all") return true;
  const complete = isCaseComplete(caseItem);
  return filter === "complete" ? complete : !complete;
}

/** Cases in the set that belong to the filter (flat list with parent ids). */
export function listCasesMatchingFilter(
  document: AlgorithmSetDocument,
  filter: CaseFilter,
): Array<{ categoryId: string; case: Case }> {
  const out: Array<{ categoryId: string; case: Case }> = [];
  for (const category of document.categories) {
    for (const caseItem of category.cases) {
      if (caseMatchesFilter(caseItem, filter)) {
        out.push({ categoryId: category.id, case: caseItem });
      }
    }
  }
  return out;
}

export function angleProgress(caseItem: Case): {
  complete: number;
  total: number;
} {
  const total = caseItem.angles.length;
  const complete = caseItem.angles.filter((a) => a.completed === 1).length;
  return { complete, total };
}

export function caseProgress(document: AlgorithmSetDocument): {
  complete: number;
  total: number;
} {
  let complete = 0;
  let total = 0;
  for (const category of document.categories) {
    for (const caseItem of category.cases) {
      total += 1;
      if (isCaseComplete(caseItem)) complete += 1;
    }
  }
  return { complete, total };
}

/**
 * Toggle or set angle completion. Returns a new document (immutable).
 * Throws if the path is missing.
 */
export function setAngleCompletion(
  document: AlgorithmSetDocument,
  categoryId: string,
  caseId: string,
  angleId: string,
  completed: CompletionFlag,
): AlgorithmSetDocument {
  let found = false;
  const categories = document.categories.map((category) => {
    if (category.id !== categoryId) return category;
    const cases = category.cases.map((caseItem) => {
      if (caseItem.id !== caseId) return caseItem;
      const angles = caseItem.angles.map((angle) => {
        if (angle.id !== angleId) return angle;
        found = true;
        return { ...angle, completed };
      });
      return { ...caseItem, angles };
    });
    return { ...category, cases };
  });
  if (!found) {
    throw new Error(
      `Angle not found: category=${categoryId} case=${caseId} angle=${angleId}`,
    );
  }
  return { ...document, categories };
}

export function toggleAngleCompletion(
  document: AlgorithmSetDocument,
  categoryId: string,
  caseId: string,
  angleId: string,
): AlgorithmSetDocument {
  const angle = findAngle(document, categoryId, caseId, angleId);
  if (!angle) {
    throw new Error(
      `Angle not found: category=${categoryId} case=${caseId} angle=${angleId}`,
    );
  }
  const next: CompletionFlag = angle.completed === 1 ? 0 : 1;
  return setAngleCompletion(document, categoryId, caseId, angleId, next);
}

function findAngle(
  document: AlgorithmSetDocument,
  categoryId: string,
  caseId: string,
  angleId: string,
): Angle | undefined {
  const category = document.categories.find((c) => c.id === categoryId);
  const caseItem = category?.cases.find((c) => c.id === caseId);
  return caseItem?.angles.find((a) => a.id === angleId);
}
