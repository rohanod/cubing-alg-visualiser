import { useCallback, useRef, useState, type DragEvent } from "react";
import "./App.css";
import {
  parseAlgorithmSetDocument,
  type AlgorithmSetDocument,
  type ParseError,
} from "./algorithm-set";
import { Alert } from "./vendor/apps-sdk-ui/components/Alert";
import { Badge } from "./vendor/apps-sdk-ui/components/Badge";
import { Button } from "./vendor/apps-sdk-ui/components/Button";
import { EmptyMessage } from "./vendor/apps-sdk-ui/components/EmptyMessage";
import { Archive } from "./vendor/apps-sdk-ui/components/Icon";
import { Textarea } from "./vendor/apps-sdk-ui/components/Textarea";

function caseCount(doc: AlgorithmSetDocument): number {
  return doc.categories.reduce((n, cat) => n + cat.cases.length, 0);
}

function formatError(error: ParseError): string {
  return error.path ? `${error.path}: ${error.message}` : error.message;
}

export default function App() {
  const [document, setDocument] = useState<AlgorithmSetDocument | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [errors, setErrors] = useState<ParseError[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  /** Parse then commit only on full success — never half-apply. */
  const tryLoad = useCallback((text: string): boolean => {
    const result = parseAlgorithmSetDocument(text);
    if (!result.ok) {
      setErrors(result.errors);
      return false;
    }
    setErrors(null);
    setDocument(result.document);
    return true;
  }, []);

  const ingestFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      const text = await file.text();
      setJsonText(text);
      tryLoad(text);
    },
    [tryLoad],
  );

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    void ingestFile(file);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Cubing Alg Visualiser</h1>
          <p className="app-tagline">Browse algorithm sets and track case angles.</p>
        </div>
        {document ? (
          <Badge color="success" pill>
            Set loaded
          </Badge>
        ) : null}
      </header>

      <main className="app-main">
        {document ? (
          <ActiveSetSummary
            document={document}
            onClear={() => {
              setDocument(null);
              setErrors(null);
            }}
          />
        ) : (
          <section
            className={`import-panel${dragging ? " import-panel--dragging" : ""}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            aria-label="Import algorithm set"
          >
            <EmptyMessage>
              <EmptyMessage.Icon color="secondary">
                <Archive />
              </EmptyMessage.Icon>
              <EmptyMessage.Title>No algorithm set loaded</EmptyMessage.Title>
              <EmptyMessage.Description>
                Choose a JSON file, drop one here, or paste into the editor — then load.
              </EmptyMessage.Description>
              <EmptyMessage.ActionRow>
                <Button
                  color="primary"
                  variant="soft"
                  size="lg"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose JSON file
                </Button>
              </EmptyMessage.ActionRow>
            </EmptyMessage>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,text/json"
              className="import-file-input"
              onChange={(e) => {
                void ingestFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            <p className="import-drop-hint" aria-hidden={dragging ? undefined : true}>
              {dragging ? "Drop JSON to load" : "Or drag and drop a .json file onto this panel"}
            </p>

            <label className="import-editor-label" htmlFor="import-json">
              Algorithm set JSON
            </label>
            <Textarea
              id="import-json"
              className="import-textarea"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              spellCheck={false}
              invalid={Boolean(errors?.length)}
              placeholder='{"schemaVersion": 1, "id": "…", "name": "…", "categories": […]}'
              aria-describedby={errors?.length ? "import-errors" : undefined}
            />

            <div className="import-actions">
              <Button
                color="primary"
                variant="solid"
                size="lg"
                type="button"
                disabled={jsonText.trim().length === 0}
                onClick={() => tryLoad(jsonText)}
              >
                Load set
              </Button>
            </div>

            {errors && errors.length > 0 ? (
              <Alert
                color="danger"
                variant="soft"
                title="Could not load algorithm set"
                description={
                  <ul id="import-errors" className="import-error-list">
                    {errors.map((error, i) => (
                      <li key={`${error.path}-${i}`}>{formatError(error)}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}

/** Temporary stand-in until browse layout (#13). Proves a set is active. */
function ActiveSetSummary({
  document,
  onClear,
}: {
  document: AlgorithmSetDocument;
  onClear: () => void;
}) {
  const cases = caseCount(document);
  const categories = document.categories.length;

  return (
    <section className="active-set" aria-live="polite">
      <h2 className="active-set-name">{document.name}</h2>
      <p className="active-set-meta">
        <code>{document.id}</code>
        {document.stage ? (
          <>
            {" · "}
            <span>stage {document.stage}</span>
          </>
        ) : null}
      </p>
      <p className="active-set-stats">
        {categories} {categories === 1 ? "category" : "categories"} · {cases}{" "}
        {cases === 1 ? "case" : "cases"}
      </p>
      {/* ponytail: clear only — replace/browse UI lands in #13 */}
      <Button color="secondary" variant="outline" size="md" type="button" onClick={onClear}>
        Clear set
      </Button>
    </section>
  );
}
