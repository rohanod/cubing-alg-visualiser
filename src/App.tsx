import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  parseAlgorithmSetDocument,
  type AlgorithmSetDocument,
  type ParseError,
} from "./algorithm-set";
import { Alert } from "./vendor/apps-sdk-ui/components/Alert";
import { Badge } from "./vendor/apps-sdk-ui/components/Badge";
import { Button } from "./vendor/apps-sdk-ui/components/Button";
import { EmptyMessage } from "./vendor/apps-sdk-ui/components/EmptyMessage";
import { Archive, FolderPlus } from "./vendor/apps-sdk-ui/components/Icon";
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
    void ingestFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="min-h-svh bg-surface">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
        <header className="flex items-start justify-between gap-3 border-b border-default pb-4">
          <div>
            <h1 className="heading-md">Cubing Alg Visualiser</h1>
            <p className="mt-1 text-sm text-secondary">
              Browse algorithm sets and track case angles.
            </p>
          </div>
          {document ? (
            <Badge color="success" pill>
              Set loaded
            </Badge>
          ) : null}
        </header>

        <main className="flex flex-1 flex-col gap-4">
          {document ? (
            <section className="flex flex-col items-start gap-3" aria-live="polite">
              <h2 className="heading-sm">{document.name}</h2>
              <p className="text-sm text-secondary">
                <code className="font-mono text-xs">{document.id}</code>
                {document.stage ? ` · stage ${document.stage}` : null}
              </p>
              <p className="text-sm">
                {document.categories.length} categories · {caseCount(document)} cases
              </p>
              <Button
                color="secondary"
                variant="soft"
                type="button"
                onClick={() => {
                  setDocument(null);
                  setErrors(null);
                }}
              >
                Clear set
              </Button>
            </section>
          ) : (
            <section
              className={
                dragging
                  ? "flex flex-col gap-4 rounded-2xl border border-info-outline bg-info-surface p-4"
                  : "flex flex-col gap-4 rounded-2xl border border-transparent p-4"
              }
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              aria-label="Import algorithm set"
            >
              {/* Exact EmptyMessage + Button composition from apps-sdk-ui stories */}
              <EmptyMessage>
                <EmptyMessage.Icon>
                  <Archive />
                </EmptyMessage.Icon>
                <EmptyMessage.Title>No algorithm set loaded</EmptyMessage.Title>
                <EmptyMessage.Description>
                  Choose a JSON file, drop one here, or paste into the editor — then load.
                </EmptyMessage.Description>
                <EmptyMessage.ActionRow>
                  <Button
                    color="primary"
                    size="lg"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FolderPlus />
                    Choose JSON file
                  </Button>
                </EmptyMessage.ActionRow>
              </EmptyMessage>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json,text/json"
                className="sr-only"
                onChange={(e) => {
                  void ingestFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <Textarea
                id="import-json"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={12}
                spellCheck={false}
                invalid={Boolean(errors?.length)}
                placeholder='{"schemaVersion": 1, "id": "…", "name": "…", "categories": […]}'
                aria-label="Algorithm set JSON"
                aria-describedby={errors?.length ? "import-errors" : undefined}
              />

              <Button
                color="primary"
                size="lg"
                type="button"
                block
                disabled={jsonText.trim().length === 0}
                onClick={() => tryLoad(jsonText)}
              >
                Load set
              </Button>

              {errors && errors.length > 0 ? (
                <Alert
                  color="danger"
                  variant="soft"
                  title="Could not load algorithm set"
                  description={
                    <ul id="import-errors" className="list-disc pl-5 text-left">
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
    </div>
  );
}
