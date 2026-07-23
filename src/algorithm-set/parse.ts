import { normaliseStage } from "./stages";
import type {
  AlgorithmSetDocument,
  Angle,
  Case,
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
import { SCHEMA_VERSION } from "./types";

const FACES: Face[] = ["U", "D", "F", "B", "L", "R"];
const COLOUR_TOKENS = new Set<ColourToken>([
  "white",
  "yellow",
  "red",
  "orange",
  "blue",
  "green",
]);

/**
 * Parse a JSON string or already-decoded value into a normalised
 * algorithm-set document. Validates schemaVersion 1 shapes, uniqueness
 * within parents, and stage aliases.
 */
export function parseAlgorithmSetDocument(input: string | unknown): ParseResult {
  let raw: unknown;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input) as unknown;
    } catch {
      return {
        ok: false,
        errors: [{ path: "", message: "Invalid JSON" }],
      };
    }
  } else {
    raw = input;
  }
  return validateAndNormalise(raw);
}

function validateAndNormalise(raw: unknown): ParseResult {
  const errors: ParseError[] = [];
  const push = (path: string, message: string) => {
    errors.push({ path, message });
  };

  if (!isPlainObject(raw)) {
    return { ok: false, errors: [{ path: "", message: "Document must be an object" }] };
  }

  if (!("schemaVersion" in raw)) {
    push("schemaVersion", "Required");
  } else if (raw.schemaVersion !== SCHEMA_VERSION) {
    push(
      "schemaVersion",
      `Must be integer ${SCHEMA_VERSION} (got ${JSON.stringify(raw.schemaVersion)})`,
    );
  }

  const id = requireNonEmptyString(raw, "id", "id", push);
  const name = requireNonEmptyString(raw, "name", "name", push);

  let stage: AlgorithmSetDocument["stage"];
  if ("stage" in raw && raw.stage !== undefined) {
    stage = parseStage(raw.stage, "stage", push);
  }

  let colourScheme: ColourScheme | undefined;
  if ("colourScheme" in raw && raw.colourScheme !== undefined) {
    colourScheme = parseColourScheme(raw.colourScheme, "colourScheme", push);
  }

  const categories = parseCategories(raw.categories, "categories", push);

  // Reject unknown top-level keys
  const allowedTop = new Set([
    "schemaVersion",
    "id",
    "name",
    "stage",
    "colourScheme",
    "categories",
  ]);
  for (const key of Object.keys(raw)) {
    if (!allowedTop.has(key)) {
      push(key, "Unknown property");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const document: AlgorithmSetDocument = {
    schemaVersion: SCHEMA_VERSION,
    id: id!,
    name: name!,
    categories: categories!,
  };
  if (stage !== undefined) document.stage = stage;
  if (colourScheme !== undefined) document.colourScheme = colourScheme;
  return { ok: true, document };
}

function parseCategories(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): Category[] | undefined {
  if (!Array.isArray(value)) {
    push(path, "Must be a non-empty array");
    return undefined;
  }
  if (value.length < 1) {
    push(path, "Must contain at least one category");
    return undefined;
  }

  const seenIds = new Set<string>();
  const categories: Category[] = [];

  for (let i = 0; i < value.length; i++) {
    const itemPath = `${path}[${i}]`;
    const item = value[i];
    if (!isPlainObject(item)) {
      push(itemPath, "Must be an object");
      continue;
    }

    const catId = requireNonEmptyString(item, "id", `${itemPath}.id`, push);
    const catName = requireNonEmptyString(item, "name", `${itemPath}.name`, push);
    if (catId !== undefined) {
      if (seenIds.has(catId)) {
        push(`${itemPath}.id`, `Duplicate category id "${catId}"`);
      } else {
        seenIds.add(catId);
      }
    }

    let icon: Category["icon"] | undefined;
    if ("icon" in item && item.icon !== undefined) {
      icon = parseCategoryIcon(item.icon, `${itemPath}.icon`, push);
    }

    const cases = parseCases(item.cases, `${itemPath}.cases`, push);

    const allowed = new Set(["id", "name", "icon", "cases"]);
    for (const key of Object.keys(item)) {
      if (!allowed.has(key)) {
        push(`${itemPath}.${key}`, "Unknown property");
      }
    }

    if (catId !== undefined && catName !== undefined && cases !== undefined) {
      const category: Category = { id: catId, name: catName, cases };
      if (icon !== undefined) category.icon = icon;
      categories.push(category);
    }
  }

  // Incomplete parse always pairs with errors; callers discard on errors.length > 0.
  return categories.length > 0 ? categories : undefined;
}

function parseCategoryIcon(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): Category["icon"] | undefined {
  if (!isPlainObject(value)) {
    push(path, "Must be an object");
    return undefined;
  }

  const setup = requireNonEmptyString(value, "setup", `${path}.setup`, push);
  let stage: NonNullable<Category["icon"]>["stage"];
  if ("stage" in value && value.stage !== undefined) {
    stage = parseStage(value.stage, `${path}.stage`, push);
  }

  const allowed = new Set(["setup", "stage"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      push(`${path}.${key}`, "Unknown property");
    }
  }

  if (setup === undefined) return undefined;
  return stage === undefined ? { setup } : { setup, stage };
}

function parseCases(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): Case[] | undefined {
  if (!Array.isArray(value)) {
    push(path, "Must be a non-empty array");
    return undefined;
  }
  if (value.length < 1) {
    push(path, "Must contain at least one case");
    return undefined;
  }

  const seenIds = new Set<string>();
  const cases: Case[] = [];

  for (let i = 0; i < value.length; i++) {
    const itemPath = `${path}[${i}]`;
    const item = value[i];
    if (!isPlainObject(item)) {
      push(itemPath, "Must be an object");
      continue;
    }

    const caseId = requireNonEmptyString(item, "id", `${itemPath}.id`, push);
    const caseName = requireNonEmptyString(item, "name", `${itemPath}.name`, push);
    const setup = requireNonEmptyString(item, "setup", `${itemPath}.setup`, push);

    if (caseId !== undefined) {
      if (seenIds.has(caseId)) {
        push(`${itemPath}.id`, `Duplicate case id "${caseId}"`);
      } else {
        seenIds.add(caseId);
      }
    }

    let stage: Case["stage"];
    if ("stage" in item && item.stage !== undefined) {
      stage = parseStage(item.stage, `${itemPath}.stage`, push);
    }

    let mask: Mask | undefined;
    if ("mask" in item && item.mask !== undefined) {
      mask = parseMask(item.mask, `${itemPath}.mask`, push);
    }

    let links: CaseLink[] | undefined;
    if ("links" in item && item.links !== undefined) {
      links = parseLinks(item.links, `${itemPath}.links`, push);
    }

    const angles = parseAngles(item.angles, `${itemPath}.angles`, push);

    const allowed = new Set([
      "id",
      "name",
      "setup",
      "stage",
      "mask",
      "links",
      "angles",
    ]);
    for (const key of Object.keys(item)) {
      if (!allowed.has(key)) {
        push(`${itemPath}.${key}`, "Unknown property");
      }
    }

    if (
      caseId !== undefined &&
      caseName !== undefined &&
      setup !== undefined &&
      angles !== undefined
    ) {
      const caseItem: Case = {
        id: caseId,
        name: caseName,
        setup,
        angles,
      };
      if (stage !== undefined) caseItem.stage = stage;
      if (mask !== undefined) caseItem.mask = mask;
      if (links !== undefined) caseItem.links = links;
      cases.push(caseItem);
    }
  }

  return cases.length > 0 ? cases : undefined;
}

function parseAngles(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): Angle[] | undefined {
  if (!Array.isArray(value)) {
    push(path, "Must be a non-empty array");
    return undefined;
  }
  if (value.length < 1) {
    push(path, "Must contain at least one angle");
    return undefined;
  }

  const seenIds = new Set<string>();
  const angles: Angle[] = [];

  for (let i = 0; i < value.length; i++) {
    const itemPath = `${path}[${i}]`;
    const item = value[i];
    if (!isPlainObject(item)) {
      push(itemPath, "Must be an object");
      continue;
    }

    const angleId = requireNonEmptyString(item, "id", `${itemPath}.id`, push);
    if (angleId !== undefined) {
      if (seenIds.has(angleId)) {
        push(`${itemPath}.id`, `Duplicate angle id "${angleId}"`);
      } else {
        seenIds.add(angleId);
      }
    }

    const solutions = parseSolutions(item.solutions, `${itemPath}.solutions`, push);

    let completed: CompletionFlag = 0;
    if ("completed" in item && item.completed !== undefined) {
      if (item.completed === 0 || item.completed === 1) {
        completed = item.completed;
      } else {
        push(
          `${itemPath}.completed`,
          "Must be integer 0 or 1 (boolean not allowed)",
        );
      }
    }

    const allowed = new Set(["id", "solutions", "completed"]);
    for (const key of Object.keys(item)) {
      if (!allowed.has(key)) {
        push(`${itemPath}.${key}`, "Unknown property");
      }
    }

    if (angleId !== undefined && solutions !== undefined) {
      angles.push({ id: angleId, solutions, completed });
    }
  }

  return angles.length > 0 ? angles : undefined;
}

function parseSolutions(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): string[] | undefined {
  if (!Array.isArray(value)) {
    push(path, "Must be a non-empty array");
    return undefined;
  }
  if (value.length < 1) {
    push(path, "Must contain at least one solution");
    return undefined;
  }
  const solutions: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const s = value[i];
    if (typeof s !== "string" || s.length < 1) {
      push(`${path}[${i}]`, "Must be a non-empty string");
    } else {
      solutions.push(s);
    }
  }
  return solutions.length === value.length ? solutions : undefined;
}

function parseLinks(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): CaseLink[] | undefined {
  if (!Array.isArray(value)) {
    push(path, "Must be an array");
    return undefined;
  }
  const links: CaseLink[] = [];
  for (let i = 0; i < value.length; i++) {
    const itemPath = `${path}[${i}]`;
    const item = value[i];
    if (!isPlainObject(item)) {
      push(itemPath, "Must be an object");
      continue;
    }
    const label = requireNonEmptyString(item, "label", `${itemPath}.label`, push);
    const url = requireNonEmptyString(item, "url", `${itemPath}.url`, push);
    if (url !== undefined && !isUri(url)) {
      push(`${itemPath}.url`, "Must be a URI");
    }
    const allowed = new Set(["label", "url"]);
    for (const key of Object.keys(item)) {
      if (!allowed.has(key)) {
        push(`${itemPath}.${key}`, "Unknown property");
      }
    }
    if (label !== undefined && url !== undefined && isUri(url)) {
      links.push({ label, url });
    }
  }
  // Empty links array is allowed
  return links.length === value.length || value.length === 0 ? links : undefined;
}

function parseMask(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): Mask | undefined {
  if (!isPlainObject(value)) {
    push(path, "Must be an object");
    return undefined;
  }
  const keys = Object.keys(value);
  if (keys.length < 1) {
    push(path, "Must include at least one face");
    return undefined;
  }
  const mask: Mask = {};
  let ok = true;
  for (const key of keys) {
    if (!FACES.includes(key as Face)) {
      push(`${path}.${key}`, "Unknown face (allowed: U,D,F,B,L,R)");
      ok = false;
      continue;
    }
    const list = value[key];
    if (!Array.isArray(list) || list.length < 1) {
      push(`${path}.${key}`, "Must be a non-empty array of sticker indices");
      ok = false;
      continue;
    }
    const indices: number[] = [];
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (typeof n !== "number" || !Number.isInteger(n) || n < 0) {
        push(`${path}.${key}[${i}]`, "Must be a non-negative integer");
        ok = false;
      } else {
        indices.push(n);
      }
    }
    if (indices.length === list.length) {
      mask[key as Face] = indices;
    }
  }
  return ok ? mask : undefined;
}

function parseColourScheme(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): ColourScheme | undefined {
  if (!isPlainObject(value)) {
    push(path, "Must be an object");
    return undefined;
  }
  for (const key of Object.keys(value)) {
    if (!FACES.includes(key as Face)) {
      push(`${path}.${key}`, "Unknown face");
    }
  }
  const scheme = {} as ColourScheme;
  let ok = true;
  for (const face of FACES) {
    if (!(face in value)) {
      push(`${path}.${face}`, "Required when colourScheme is present");
      ok = false;
      continue;
    }
    const token = value[face];
    if (typeof token !== "string" || !COLOUR_TOKENS.has(token as ColourToken)) {
      push(
        `${path}.${face}`,
        "Must be a colour token (white|yellow|red|orange|blue|green)",
      );
      ok = false;
    } else {
      scheme[face] = token as ColourToken;
    }
  }
  return ok ? scheme : undefined;
}

function parseStage(
  value: unknown,
  path: string,
  push: (path: string, message: string) => void,
): AlgorithmSetDocument["stage"] | undefined {
  if (typeof value !== "string") {
    push(path, "Must be a string");
    return undefined;
  }
  const canonical = normaliseStage(value);
  if (canonical === null) {
    push(path, `Unknown stage "${value}"`);
    return undefined;
  }
  return canonical;
}

function requireNonEmptyString(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  push: (path: string, message: string) => void,
): string | undefined {
  if (!(key in obj) || obj[key] === undefined) {
    push(path, "Required");
    return undefined;
  }
  const v = obj[key];
  if (typeof v !== "string" || v.length < 1) {
    push(path, "Must be a non-empty string");
    return undefined;
  }
  return v;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Absolute URI check (schema `format: uri`). */
function isUri(value: string): boolean {
  try {
    const u = new URL(value);
    return Boolean(u.protocol && u.protocol !== ":");
  } catch {
    return false;
  }
}
