import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import type { AlgorithmSetDocument, Case, Category } from "./algorithm-set";
import { Button } from "./vendor/apps-sdk-ui/components/Button";
import { EmptyMessage } from "./vendor/apps-sdk-ui/components/EmptyMessage";
import { ArrowLeft } from "./vendor/apps-sdk-ui/components/Icon";

type MobileLevel = "categories" | "cases" | "detail";

type BrowseLayoutProps = {
  document: AlgorithmSetDocument;
  onClear: () => void;
};

function caseCount(doc: AlgorithmSetDocument): number {
  return doc.categories.reduce((n, cat) => n + cat.cases.length, 0);
}

/** Safe lookups — never assume selection still exists after clear/reload. */
function findCategory(
  doc: AlgorithmSetDocument,
  id: string | null,
): Category | null {
  if (!id) return null;
  return doc.categories.find((c) => c.id === id) ?? null;
}

function findCase(category: Category | null, id: string | null): Case | null {
  if (!category || !id) return null;
  return category.cases.find((c) => c.id === id) ?? null;
}

export function BrowseLayout({ document, onClear }: BrowseLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [mobileLevel, setMobileLevel] = useState<MobileLevel>("categories");

  const category = findCategory(document, categoryId);
  const selectedCase = findCase(category, caseId);

  // Drop stale selection when the loaded document changes.
  useEffect(() => {
    setCategoryId(null);
    setCaseId(null);
    setMobileLevel("categories");
  }, [document.id]);

  const selectCategory = (id: string) => {
    setCategoryId(id);
    setCaseId(null);
    if (!isDesktop) setMobileLevel("cases");
  };

  const selectCase = (id: string) => {
    setCaseId(id);
    if (!isDesktop) setMobileLevel("detail");
  };

  const goBack = () => {
    if (mobileLevel === "detail") {
      setCaseId(null);
      setMobileLevel("cases");
      return;
    }
    if (mobileLevel === "cases") {
      setCategoryId(null);
      setCaseId(null);
      setMobileLevel("categories");
    }
  };

  const showCategories = isDesktop || mobileLevel === "categories";
  const showCases = isDesktop || mobileLevel === "cases";
  const showDetail = isDesktop || mobileLevel === "detail";
  const showBack = !isDesktop && mobileLevel !== "categories";

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="flex shrink-0 items-center gap-2 border-b border-default px-3 py-2 sm:px-4">
        {showBack ? (
          <Button
            color="secondary"
            variant="ghost"
            size="xl"
            type="button"
            onClick={goBack}
            aria-label="Back"
          >
            <ArrowLeft />
            Back
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="heading-sm truncate">{document.name}</h1>
          <p className="truncate text-xs text-secondary">
            {document.categories.length} categories · {caseCount(document)} cases
            {document.stage ? ` · ${document.stage}` : null}
          </p>
        </div>
        <Button
          color="secondary"
          variant="soft"
          size="lg"
          type="button"
          onClick={onClear}
        >
          Clear set
        </Button>
      </header>

      <div
        className={
          isDesktop
            ? "grid min-h-0 flex-1 grid-cols-[minmax(12rem,16rem)_minmax(14rem,18rem)_1fr]"
            : "flex min-h-0 flex-1 flex-col"
        }
      >
        {showCategories ? (
          <nav
            className="flex min-h-0 flex-col border-default md:border-r"
            aria-label="Categories"
          >
            <div className="border-b border-default px-3 py-2 text-xs font-medium text-secondary">
              Categories
            </div>
            {document.categories.length === 0 ? (
              <div className="p-4">
                <EmptyMessage>
                  <EmptyMessage.Title>No categories</EmptyMessage.Title>
                  <EmptyMessage.Description>
                    This set has no categories to browse.
                  </EmptyMessage.Description>
                </EmptyMessage>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {document.categories.map((cat) => {
                  const selected = cat.id === category?.id;
                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        className={
                          selected
                            ? "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg bg-primary-surface px-3 py-2 text-left text-sm font-medium text-primary"
                            : "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                        }
                        aria-current={selected ? "true" : undefined}
                        onClick={() => selectCategory(cat.id)}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="shrink-0 text-xs text-secondary">
                          {cat.cases.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        ) : null}

        {showCases ? (
          <section
            className="flex min-h-0 flex-col border-default md:border-r"
            aria-label="Cases"
          >
            <div className="border-b border-default px-3 py-2 text-xs font-medium text-secondary">
              {category ? category.name : "Cases"}
            </div>
            {!category ? (
              <div className="p-4">
                <EmptyMessage>
                  <EmptyMessage.Title>Select a category</EmptyMessage.Title>
                  <EmptyMessage.Description>
                    Choose a category to list its cases.
                  </EmptyMessage.Description>
                </EmptyMessage>
              </div>
            ) : category.cases.length === 0 ? (
              <div className="p-4">
                <EmptyMessage>
                  <EmptyMessage.Title>No cases</EmptyMessage.Title>
                  <EmptyMessage.Description>
                    This category has no cases.
                  </EmptyMessage.Description>
                </EmptyMessage>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {category.cases.map((c) => {
                  const selected = c.id === selectedCase?.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={
                          selected
                            ? "flex min-h-11 w-full items-center rounded-lg bg-primary-surface px-3 py-2 text-left text-sm font-medium text-primary"
                            : "flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                        }
                        aria-current={selected ? "true" : undefined}
                        onClick={() => selectCase(c.id)}
                      >
                        <span className="truncate">{c.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {showDetail ? (
          <section className="min-h-0 flex-1 overflow-y-auto" aria-label="Case detail">
            {selectedCase ? (
              <CaseDetail caseItem={selectedCase} />
            ) : (
              <div className="p-4">
                <EmptyMessage>
                  <EmptyMessage.Title>Select a case</EmptyMessage.Title>
                  <EmptyMessage.Description>
                    Choose a case to see setup, angles, and links.
                  </EmptyMessage.Description>
                </EmptyMessage>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CaseDetail({ caseItem }: { caseItem: Case }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h2 className="heading-md">{caseItem.name}</h2>
        <p className="mt-1 font-mono text-xs text-secondary">{caseItem.id}</p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-secondary">
          Setup
        </h3>
        <p className="rounded-lg border border-default bg-surface-secondary px-3 py-3 font-mono text-sm">
          {caseItem.setup}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-secondary">
          Angles
        </h3>
        {caseItem.angles.length === 0 ? (
          <p className="text-sm text-secondary">No angles defined.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {caseItem.angles.map((angle) => (
              <li
                key={angle.id}
                className="rounded-xl border border-default p-3"
              >
                <div className="mb-2 text-sm font-medium">{angle.id}</div>
                {angle.solutions.length === 0 ? (
                  <p className="text-sm text-secondary">No solutions.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {angle.solutions.map((sol, i) => (
                      <li
                        key={`${angle.id}-${i}`}
                        className="font-mono text-sm leading-relaxed"
                      >
                        {sol}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {caseItem.links && caseItem.links.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-secondary">
            Links
          </h3>
          <ul className="flex flex-col gap-1">
            {caseItem.links.map((link) => (
              <li key={`${link.label}-${link.url}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-2 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
