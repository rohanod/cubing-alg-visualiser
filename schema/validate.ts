/**
 * Validates schema/examples/minimal.json against algorithm-set.schema.json
 * and checks a few reject cases from the authoring grill.
 * Run: bun run validate:schema
 */
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "./algorithm-set.schema.json";
import example from "./examples/minimal.json";

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validate = ajv.compile(schema);

function mustPass(label: string, data: unknown) {
  if (!validate(data)) {
    console.error(`FAIL (expected pass): ${label}`);
    console.error(validate.errors);
    process.exit(1);
  }
  console.log(`OK pass: ${label}`);
}

function mustFail(label: string, data: unknown) {
  if (validate(data)) {
    console.error(`FAIL (expected reject): ${label}`);
    process.exit(1);
  }
  console.log(`OK reject: ${label}`);
}

mustPass("examples/minimal.json", example);

const base = structuredClone(example) as Record<string, unknown>;

mustFail("unknown stage superoll", {
  ...base,
  stage: "superoll",
});

mustFail("empty angles", {
  ...base,
  categories: [
    {
      id: "c",
      name: "C",
      cases: [
        {
          id: "x",
          name: "X",
          setup: "R U R'",
          angles: [],
        },
      ],
    },
  ],
});

mustFail("schemaVersion string", {
  ...base,
  schemaVersion: "1",
});

mustFail("extra property", {
  ...base,
  notes: "nope",
});

mustPass("stage alias F2L", {
  ...base,
  stage: "F2L",
});

console.log("All schema checks passed.");
