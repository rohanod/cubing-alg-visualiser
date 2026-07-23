import { describe, expect, test } from "bun:test";
import minimalExample from "../../schema/examples/minimal.json";
import {
  caseMatchesFilter,
  caseProgress,
  exportAlgorithmSetDocument,
  isCaseComplete,
  isCategoryComplete,
  isSetComplete,
  listCasesMatchingFilter,
  parseAlgorithmSetDocument,
  serializeAlgorithmSetDocument,
  setAngleCompletion,
  toggleAngleCompletion,
  type AlgorithmSetDocument,
  type Case,
  type CaseFilter,
} from "./index";

// ─── fixtures ───────────────────────────────────────────────────────────────

function baseDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: "test-set",
    name: "Test Set",
    categories: [
      {
        id: "cat-a",
        name: "Category A",
        cases: [
          {
            id: "case-1",
            name: "Case One",
            setup: "R U R'",
            angles: [
              { id: "FR", solutions: ["U R U' R'"], completed: 0 },
              { id: "FL", solutions: ["U' L' U L"], completed: 0 },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function docWithCategoryIcon(icon: unknown): Record<string, unknown> {
  return baseDoc({
    categories: [
      {
        id: "cat",
        name: "Cat",
        icon,
        cases: [
          {
            id: "c",
            name: "C",
            setup: "R",
            angles: [{ id: "a", solutions: ["U"] }],
          },
        ],
      },
    ],
  });
}

function caseWithAngles(
  angles: Array<{ id: string; completed?: 0 | 1; solutions?: string[] }>,
): Case {
  return {
    id: "c",
    name: "C",
    setup: "R U R'",
    angles: angles.map((a) => ({
      id: a.id,
      solutions: a.solutions ?? ["R U R'"],
      completed: a.completed ?? 0,
    })),
  };
}

// ─── validate / parse ───────────────────────────────────────────────────────

describe("parseAlgorithmSetDocument — acceptance", () => {
  const acceptCases: Array<{ name: string; input: unknown }> = [
    { name: "repo minimal example", input: minimalExample },
    { name: "minimal valid object", input: baseDoc() },
    {
      name: "stage alias F2L normalises",
      input: baseDoc({ stage: "F2L" }),
    },
    {
      name: "sparse free-form angles",
      input: baseDoc({
        categories: [
          {
            id: "cat",
            name: "Cat",
            cases: [
              {
                id: "sparse",
                name: "Sparse",
                setup: "F R U R' U' F'",
                angles: [{ id: "front", solutions: ["R U R'"] }],
              },
            ],
          },
        ],
      }),
    },
    {
      name: "omitted completed → 0",
      input: baseDoc({
        categories: [
          {
            id: "cat",
            name: "Cat",
            cases: [
              {
                id: "c",
                name: "C",
                setup: "R U",
                angles: [{ id: "a", solutions: ["R"] }],
              },
            ],
          },
        ],
      }),
    },
    {
      name: "full colourScheme",
      input: baseDoc({
        colourScheme: {
          U: "yellow",
          D: "white",
          F: "blue",
          B: "green",
          L: "orange",
          R: "red",
        },
      }),
    },
    {
      name: "same case id in two categories allowed",
      input: baseDoc({
        categories: [
          {
            id: "a",
            name: "A",
            cases: [
              {
                id: "shared",
                name: "One",
                setup: "R",
                angles: [{ id: "x", solutions: ["U"] }],
              },
            ],
          },
          {
            id: "b",
            name: "B",
            cases: [
              {
                id: "shared",
                name: "Two",
                setup: "L",
                angles: [{ id: "x", solutions: ["U'"] }],
              },
            ],
          },
        ],
      }),
    },
  ];

  for (const { name, input } of acceptCases) {
    test(`accepts: ${name}`, () => {
      const result = parseAlgorithmSetDocument(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.schemaVersion).toBe(1);
        expect(result.document.id.length).toBeGreaterThan(0);
      }
    });
  }

  test("normalises stage aliases to canonical lowercase", () => {
    const result = parseAlgorithmSetDocument(baseDoc({ stage: "Full" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.stage).toBe("none");
    }
    const coll = parseAlgorithmSetDocument(baseDoc({ stage: "COLL" }));
    expect(coll.ok).toBe(true);
    if (coll.ok) expect(coll.document.stage).toBe("cll");

    const lastLayer = parseAlgorithmSetDocument(
      baseDoc({ stage: "last-layer" }),
    );
    expect(lastLayer.ok).toBe(true);
    if (lastLayer.ok) expect(lastLayer.document.stage).toBe("ll");
  });

  test("normalises category icon stage aliases", () => {
    const result = parseAlgorithmSetDocument(
      docWithCategoryIcon({ setup: "R U R'", stage: "F2L" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.categories[0]!.icon).toEqual({
        setup: "R U R'",
        stage: "f2l",
      });
    }
  });

  test("omitted completed becomes 0 in memory", () => {
    const result = parseAlgorithmSetDocument(
      baseDoc({
        categories: [
          {
            id: "cat",
            name: "Cat",
            cases: [
              {
                id: "c",
                name: "C",
                setup: "R",
                angles: [{ id: "a", solutions: ["U"] }],
              },
            ],
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.categories[0]!.cases[0]!.angles[0]!.completed).toBe(
        0,
      );
    }
  });

  test("parses JSON string input", () => {
    const result = parseAlgorithmSetDocument(JSON.stringify(baseDoc()));
    expect(result.ok).toBe(true);
  });
});

describe("parseAlgorithmSetDocument — rejection", () => {
  const rejectCases: Array<{ name: string; input: unknown; pathHint?: string }> =
    [
      { name: "schemaVersion string", input: baseDoc({ schemaVersion: "1" }), pathHint: "schemaVersion" },
      { name: "schemaVersion 2", input: baseDoc({ schemaVersion: 2 }), pathHint: "schemaVersion" },
      { name: "missing id", input: (() => { const d = baseDoc(); delete d.id; return d; })(), pathHint: "id" },
      { name: "empty id", input: baseDoc({ id: "" }), pathHint: "id" },
      { name: "missing name", input: (() => { const d = baseDoc(); delete d.name; return d; })(), pathHint: "name" },
      { name: "extra top-level property", input: baseDoc({ notes: "nope" }), pathHint: "notes" },
      { name: "unknown stage superoll", input: baseDoc({ stage: "superoll" }), pathHint: "stage" },
      {
        name: "empty angles",
        input: baseDoc({
          categories: [
            {
              id: "c",
              name: "C",
              cases: [
                { id: "x", name: "X", setup: "R U R'", angles: [] },
              ],
            },
          ],
        }),
        pathHint: "angles",
      },
      {
        name: "empty solutions",
        input: baseDoc({
          categories: [
            {
              id: "c",
              name: "C",
              cases: [
                {
                  id: "x",
                  name: "X",
                  setup: "R",
                  angles: [{ id: "a", solutions: [] }],
                },
              ],
            },
          ],
        }),
        pathHint: "solutions",
      },
      {
        name: "boolean completed",
        input: baseDoc({
          categories: [
            {
              id: "c",
              name: "C",
              cases: [
                {
                  id: "x",
                  name: "X",
                  setup: "R",
                  angles: [{ id: "a", solutions: ["U"], completed: true }],
                },
              ],
            },
          ],
        }),
        pathHint: "completed",
      },
      {
        name: "empty setup",
        input: baseDoc({
          categories: [
            {
              id: "c",
              name: "C",
              cases: [
                {
                  id: "x",
                  name: "X",
                  setup: "",
                  angles: [{ id: "a", solutions: ["U"] }],
                },
              ],
            },
          ],
        }),
        pathHint: "setup",
      },
      ...[
        ["category icon is not an object", "icon", "icon"],
        ["category icon missing setup", {}, "setup"],
        ["category icon empty setup", { setup: "" }, "setup"],
        [
          "category icon invalid stage",
          { setup: "R", stage: "superoll" },
          "stage",
        ],
        [
          "category icon unknown property",
          { setup: "R", notes: "nope" },
          "notes",
        ],
      ].map(([name, icon, pathHint]) => ({
        name: name as string,
        input: docWithCategoryIcon(icon),
        pathHint: pathHint as string,
      })),
      {
        name: "empty categories",
        input: baseDoc({ categories: [] }),
        pathHint: "categories",
      },
      {
        name: "duplicate category ids",
        input: baseDoc({
          categories: [
            {
              id: "dup",
              name: "A",
              cases: [
                {
                  id: "c1",
                  name: "C1",
                  setup: "R",
                  angles: [{ id: "a", solutions: ["U"] }],
                },
              ],
            },
            {
              id: "dup",
              name: "B",
              cases: [
                {
                  id: "c2",
                  name: "C2",
                  setup: "L",
                  angles: [{ id: "a", solutions: ["U"] }],
                },
              ],
            },
          ],
        }),
        pathHint: "id",
      },
      {
        name: "duplicate angle ids in case",
        input: baseDoc({
          categories: [
            {
              id: "c",
              name: "C",
              cases: [
                {
                  id: "x",
                  name: "X",
                  setup: "R",
                  angles: [
                    { id: "same", solutions: ["U"] },
                    { id: "same", solutions: ["U'"] },
                  ],
                },
              ],
            },
          ],
        }),
        pathHint: "id",
      },
      {
        name: "partial colourScheme",
        input: baseDoc({ colourScheme: { U: "yellow" } }),
        pathHint: "colourScheme",
      },
      {
        name: "empty mask object",
        input: baseDoc({
          categories: [
            {
              id: "c",
              name: "C",
              cases: [
                {
                  id: "x",
                  name: "X",
                  setup: "R",
                  mask: {},
                  angles: [{ id: "a", solutions: ["U"] }],
                },
              ],
            },
          ],
        }),
        pathHint: "mask",
      },
      { name: "invalid JSON string", input: "{not json", pathHint: "" },
      { name: "non-object document", input: [1, 2, 3] },
    ];

  for (const { name, input, pathHint } of rejectCases) {
    test(`rejects: ${name}`, () => {
      const result = parseAlgorithmSetDocument(input);
      expect(result.ok).toBe(false);
      if (!result.ok && pathHint !== undefined) {
        const paths = result.errors.map((e) => e.path).join(" ");
        const messages = result.errors.map((e) => e.message).join(" ");
        expect(paths.includes(pathHint) || messages.toLowerCase().includes("json")).toBe(
          true,
        );
      }
    });
  }
});

// ─── dual completion ────────────────────────────────────────────────────────

describe("dual completion", () => {
  const completionRows: Array<{
    name: string;
    angles: Array<{ id: string; completed?: 0 | 1 }>;
    caseComplete: boolean;
  }> = [
    {
      name: "all incomplete",
      angles: [
        { id: "FR", completed: 0 },
        { id: "FL", completed: 0 },
      ],
      caseComplete: false,
    },
    {
      name: "partial",
      angles: [
        { id: "FR", completed: 1 },
        { id: "FL", completed: 0 },
      ],
      caseComplete: false,
    },
    {
      name: "all complete",
      angles: [
        { id: "FR", completed: 1 },
        { id: "FL", completed: 1 },
      ],
      caseComplete: true,
    },
    {
      name: "single sparse angle complete",
      angles: [{ id: "front", completed: 1 }],
      caseComplete: true,
    },
    {
      name: "single sparse angle incomplete",
      angles: [{ id: "front", completed: 0 }],
      caseComplete: false,
    },
    {
      name: "free-form ids only those defined matter",
      angles: [
        { id: "back-left", completed: 1 },
        { id: "weird", completed: 1 },
      ],
      caseComplete: true,
    },
  ];

  for (const row of completionRows) {
    test(`case complete: ${row.name}`, () => {
      const c = caseWithAngles(row.angles);
      expect(isCaseComplete(c)).toBe(row.caseComplete);
    });
  }

  test("category/set complete derive from cases", () => {
    const result = parseAlgorithmSetDocument(
      baseDoc({
        categories: [
          {
            id: "cat",
            name: "Cat",
            cases: [
              {
                id: "done",
                name: "Done",
                setup: "R",
                angles: [{ id: "a", solutions: ["U"], completed: 1 }],
              },
              {
                id: "todo",
                name: "Todo",
                setup: "L",
                angles: [{ id: "a", solutions: ["U"], completed: 0 }],
              },
            ],
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = result.document;
    expect(isCaseComplete(doc.categories[0]!.cases[0]!)).toBe(true);
    expect(isCaseComplete(doc.categories[0]!.cases[1]!)).toBe(false);
    expect(isCategoryComplete(doc.categories[0]!)).toBe(false);
    expect(isSetComplete(doc)).toBe(false);

    const finished = setAngleCompletion(doc, "cat", "todo", "a", 1);
    expect(isCategoryComplete(finished.categories[0]!)).toBe(true);
    expect(isSetComplete(finished)).toBe(true);
    expect(caseProgress(finished)).toEqual({ complete: 2, total: 2 });
  });

  test("toggleAngleCompletion flips flag without mutating input", () => {
    const result = parseAlgorithmSetDocument(baseDoc());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = result.document;
    const next = toggleAngleCompletion(doc, "cat-a", "case-1", "FR");
    expect(doc.categories[0]!.cases[0]!.angles[0]!.completed).toBe(0);
    expect(next.categories[0]!.cases[0]!.angles[0]!.completed).toBe(1);
    const back = toggleAngleCompletion(next, "cat-a", "case-1", "FR");
    expect(back.categories[0]!.cases[0]!.angles[0]!.completed).toBe(0);
  });
});

// ─── filter membership ──────────────────────────────────────────────────────

describe("filter membership All / Incomplete / Complete", () => {
  function buildMixedDoc(): AlgorithmSetDocument {
    const result = parseAlgorithmSetDocument(
      baseDoc({
        categories: [
          {
            id: "cat",
            name: "Cat",
            cases: [
              {
                id: "complete-case",
                name: "Complete",
                setup: "R",
                angles: [
                  { id: "a", solutions: ["U"], completed: 1 },
                  { id: "b", solutions: ["U'"], completed: 1 },
                ],
              },
              {
                id: "incomplete-case",
                name: "Incomplete",
                setup: "L",
                angles: [
                  { id: "a", solutions: ["U"], completed: 1 },
                  { id: "b", solutions: ["U'"], completed: 0 },
                ],
              },
              {
                id: "empty-progress",
                name: "None",
                setup: "F",
                angles: [{ id: "front", solutions: ["R"], completed: 0 }],
              },
            ],
          },
        ],
      }),
    );
    if (!result.ok) throw new Error("fixture invalid");
    return result.document;
  }

  const filterRows: Array<{
    filter: CaseFilter;
    expectedIds: string[];
  }> = [
    {
      filter: "all",
      expectedIds: ["complete-case", "incomplete-case", "empty-progress"],
    },
    {
      filter: "complete",
      expectedIds: ["complete-case"],
    },
    {
      filter: "incomplete",
      expectedIds: ["incomplete-case", "empty-progress"],
    },
  ];

  for (const { filter, expectedIds } of filterRows) {
    test(`filter ${filter}`, () => {
      const doc = buildMixedDoc();
      const matched = listCasesMatchingFilter(doc, filter).map(
        (m) => m.case.id,
      );
      expect(matched).toEqual(expectedIds);

      for (const caseItem of doc.categories[0]!.cases) {
        const shouldMatch = expectedIds.includes(caseItem.id);
        expect(caseMatchesFilter(caseItem, filter)).toBe(shouldMatch);
      }
    });
  }
});

// ─── export serialisation ───────────────────────────────────────────────────

describe("export serialisation", () => {
  test("always writes completed 0|1 (never omits)", () => {
    const result = parseAlgorithmSetDocument(
      baseDoc({
        categories: [
          {
            id: "cat",
            name: "Cat",
            cases: [
              {
                id: "c",
                name: "C",
                setup: "R",
                angles: [
                  { id: "omit", solutions: ["U"] },
                  { id: "one", solutions: ["U'"], completed: 1 },
                ],
              },
            ],
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const exported = exportAlgorithmSetDocument(result.document);
    for (const angle of exported.categories[0]!.cases[0]!.angles) {
      expect(angle.completed === 0 || angle.completed === 1).toBe(true);
      expect("completed" in angle).toBe(true);
    }
    expect(exported.categories[0]!.cases[0]!.angles[0]!.completed).toBe(0);
    expect(exported.categories[0]!.cases[0]!.angles[1]!.completed).toBe(1);
  });

  test("round-trips completion flags through serialize → parse", () => {
    const result = parseAlgorithmSetDocument(minimalExample);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    let doc = result.document;
    doc = setAngleCompletion(doc, "easy-inserts", "ei1", "FR", 1);
    doc = setAngleCompletion(doc, "easy-inserts", "ei1", "FL", 1);

    const json = serializeAlgorithmSetDocument(doc);
    const again = parseAlgorithmSetDocument(json);
    expect(again.ok).toBe(true);
    if (!again.ok) return;

    const ei1 = again.document.categories[0]!.cases.find((c) => c.id === "ei1")!;
    expect(ei1.angles.find((a) => a.id === "FR")!.completed).toBe(1);
    expect(ei1.angles.find((a) => a.id === "FL")!.completed).toBe(1);
    expect(isCaseComplete(ei1)).toBe(true);

    const ei2 = again.document.categories[0]!.cases.find((c) => c.id === "ei2")!;
    expect(ei2.angles[0]!.completed).toBe(1);

    // Stage stays canonical and category icon metadata survives export.
    expect(again.document.stage).toBe("f2l");
    expect(again.document.categories[0]!.icon).toEqual({
      setup: "R U R' U'",
    });
  });

  test("export object matches import shape keys", () => {
    const result = parseAlgorithmSetDocument(baseDoc({ stage: "F2L" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const exported = exportAlgorithmSetDocument(result.document);
    expect(exported.stage).toBe("f2l");
    expect(exported.schemaVersion).toBe(1);
    expect(Object.keys(exported).sort()).toEqual(
      ["categories", "id", "name", "schemaVersion", "stage"].sort(),
    );
  });
});
