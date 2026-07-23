import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import {
  caseMatchesFilter,
  caseProgress,
  isCaseComplete,
  type AlgorithmSetDocument,
  type Case,
  type CaseFilter,
  type Category,
} from "./algorithm-set";
import { Button } from "./vendor/apps-sdk-ui/components/Button";
import { Checkbox } from "./vendor/apps-sdk-ui/components/Checkbox";
import { EmptyMessage } from "./vendor/apps-sdk-ui/components/EmptyMessage";
import { ArrowLeft } from "./vendor/apps-sdk-ui/components/Icon";
import { RadioGroup } from "./vendor/apps-sdk-ui/components/RadioGroup";

type MobileLevel = "categories" | "cases" | "detail";

type BrowseLayoutProps = {
  document: AlgorithmSetDocument;
  onClear: () => void;
  onToggleAngle: (categoryId: string, caseId: string, angleId: string) => void;
};

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

export function BrowseLayout({
  document,
  onClear,
  onToggleAngle,
}: BrowseLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CaseFilter>("all");
  const [mobileLevel, setMobileLevel] = useState<MobileLevel>("categories");

  const progress = caseProgress(document);
  const category = findCategory(document, categoryId);
  const filteredCases = category
    ? category.cases.filter((caseItem) => caseMatchesFilter(caseItem, filter))
    : [];
  const selectedCase = findCase(category, caseId);
  const visibleCase =
    selectedCase && caseMatchesFilter(selectedCase, filter)
      ? selectedCase
      : null;

  // Drop stale selection when the loaded document changes.
  useEffect(() => {
    setCategoryId(null);
    setCaseId(null);
    setFilter("all");
    setMobileLevel("categories");
  }, [document.id]);

  // A completion toggle can move the open case out of the active filter.
  useEffect(() => {
    if (!selectedCase || visibleCase) return;
    setCaseId(null);
    setMobileLevel((level) => (level === "detail" ? "cases" : level));
  }, [selectedCase, visibleCase]);

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
            {document.categories.length} categories · {progress.complete}/
            {progress.total} cases complete
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
                  const complete = cat.cases.filter(isCaseComplete).length;
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
                          {complete}/{cat.cases.length}
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
            <div className="flex flex-col gap-2 border-b border-default px-3 py-2 text-xs font-medium text-secondary">
              <span>{category ? category.name : "Cases"}</span>
              {category ? (
                <RadioGroup<CaseFilter>
                  value={filter}
                  onChange={setFilter}
                  aria-label="Filter cases"
                  className="flex-wrap text-primary"
                >
                  <RadioGroup.Item value="all">All</RadioGroup.Item>
                  <RadioGroup.Item value="incomplete">Incomplete</RadioGroup.Item>
                  <RadioGroup.Item value="complete">Complete</RadioGroup.Item>
                </RadioGroup>
              ) : null}
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
            ) : filteredCases.length === 0 ? (
              <div className="p-4">
                <EmptyMessage>
                  <EmptyMessage.Title>No {filter} cases</EmptyMessage.Title>
                  <EmptyMessage.Description>
                    No cases in this category match this filter. Choose All to
                    see every case.
                  </EmptyMessage.Description>
                </EmptyMessage>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {filteredCases.map((caseItem) => {
                  const selected = caseItem.id === visibleCase?.id;
                  const complete = isCaseComplete(caseItem);
                  return (
                    <li key={caseItem.id}>
                      <button
                        type="button"
                        className={
                          selected
                            ? "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg bg-primary-surface px-3 py-2 text-left text-sm font-medium text-primary"
                            : "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                        }
                        aria-current={selected ? "true" : undefined}
                        onClick={() => selectCase(caseItem.id)}
                      >
                        <span className="truncate">{caseItem.name}</span>
                        <span className="shrink-0 text-xs text-secondary">
                          {complete ? "Complete" : "Incomplete"}
                        </span>
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
            {visibleCase && category ? (
              <CaseDetail
                caseItem={visibleCase}
                onToggleAngle={(angleId) =>
                  onToggleAngle(category.id, visibleCase.id, angleId)
                }
              />
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

function CaseDetail({
  caseItem,
  onToggleAngle,
}: {
  caseItem: Case;
  onToggleAngle: (angleId: string) => void;
}) {
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
                <Checkbox
                  className="mb-2"
                  checked={angle.completed === 1}
                  onCheckedChange={() => onToggleAngle(angle.id)}
                  label={
                    <>
                      <span className="text-sm font-medium">{angle.id}</span>
                      <span className="sr-only"> complete</span>
                    </>
                  }
                />
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
