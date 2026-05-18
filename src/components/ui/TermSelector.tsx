import React from "react";

export type Term = "first" | "second" | "third";

export const TERM_LABELS: Record<Term, string> = {
  first: "1st Term",
  second: "2nd Term",
  third: "3rd Term",
};

export const TERM_RANGES: Record<Term, string> = {
  first: "Sep 1 – Dec 30",
  second: "Jan 1 – Apr 30",
  third: "May 1 – Aug 31",
};

export const TERM_FULL_LABELS: Record<Term, string> = {
  first: "1st Term (Sep 1 – Dec 30)",
  second: "2nd Term (Jan 1 – Apr 30)",
  third: "3rd Term (May 1 – Aug 31)",
};

// Returns the current term based on the configured date ranges:
// 1st: Sep 1 – Dec 30 · 2nd: Jan 1 – Apr 30 · 3rd: May 1 – Aug 31
export function getCurrentTerm(date: Date = new Date()): Term {
  const month = date.getMonth() + 1;
  if (month >= 9 && month <= 12) return "first";
  if (month >= 1 && month <= 4) return "second";
  return "third";
}

// Academic year is "YYYY/YYYY+1". The new academic year starts when 1st Term
// begins on September 1, so Jan–Aug belong to the (year-1)/year session.
export function getCurrentAcademicYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

export function getAcademicYearOptions(count = 5, date: Date = new Date()): string[] {
  const current = getCurrentAcademicYear(date);
  const startYear = Number(current.split("/")[0]);
  const options: string[] = [];
  for (let i = 0; i < count; i++) {
    const s = startYear - i;
    options.push(`${s}/${s + 1}`);
  }
  return options;
}

interface TermSelectorProps {
  term: Term;
  academicYear?: string;
  onTermChange: (term: Term) => void;
  onAcademicYearChange?: (year: string) => void;
  yearOptions?: string[];
  className?: string;
  showArchiveBadge?: boolean;
}

export const TermSelector: React.FC<TermSelectorProps> = ({
  term,
  academicYear,
  onTermChange,
  onAcademicYearChange,
  yearOptions,
  className = "",
  showArchiveBadge = true,
}) => {
  const currentTerm = getCurrentTerm();
  const currentYear = getCurrentAcademicYear();
  const showYearPicker = !!onAcademicYearChange && !!academicYear;
  const years = yearOptions ?? getAcademicYearOptions(5);
  const isArchive =
    term !== currentTerm ||
    (academicYear !== undefined && academicYear !== currentYear);

  return (
    <div className={`ledger-card p-4 md:p-5 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
            calendar_month
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Academic Term
            </p>
            <p className="font-headline font-extrabold text-base md:text-lg text-primary leading-tight">
              {TERM_LABELS[term]}
              {showYearPicker ? ` · ${academicYear}` : ""}
            </p>
          </div>
        </div>
        {showArchiveBadge && isArchive ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>archive</span>
            Archived View
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fiber_manual_record</span>
            Current Term
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Select term"
        className="grid grid-cols-3 gap-2"
      >
        {(Object.keys(TERM_LABELS) as Term[]).map((t) => {
          const active = t === term;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onTermChange(t)}
              className={
                "px-2 md:px-3 py-2.5 md:py-3 rounded-xl text-left transition-all border-2 " +
                (active
                  ? "bg-gradient-to-br from-primary to-primary-container text-on-primary border-primary shadow-card"
                  : "bg-surface-container-low border-transparent hover:bg-surface-container hover:border-outline-variant/40")
              }
            >
              <p
                className={
                  "font-headline font-extrabold text-sm md:text-base " +
                  (active ? "text-on-primary" : "text-primary")
                }
              >
                {TERM_LABELS[t]}
              </p>
              <p
                className={
                  "text-[10px] md:text-xs mt-0.5 " +
                  (active ? "text-on-primary/75" : "text-on-surface-variant")
                }
              >
                {TERM_RANGES[t]}
              </p>
            </button>
          );
        })}
      </div>

      {showYearPicker && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Academic Year
          </label>
          <select
            value={academicYear}
            onChange={(e) => onAcademicYearChange!(e.target.value)}
            className="bg-surface-container-highest border-none rounded-lg px-3 py-1.5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
                {y === currentYear ? "  (current)" : ""}
              </option>
            ))}
          </select>
          {academicYear !== currentYear && (
            <button
              type="button"
              onClick={() => onAcademicYearChange!(currentYear)}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Jump to current ({currentYear})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
