import { renderToStaticMarkup } from "react-dom/server";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  TermSelector,
  getCurrentTerm,
  getCurrentAcademicYear,
} from "@/components/ui/TermSelector";
import {
  Term,
  StudentResult,
  School,
  Subject,
  Class,
  ClassResult,
  PsychometricAssessment,
  ResultComment,
  Score,
  Student,
} from "@/types";
import { ClassicResultSheet } from "@/templates/ClassicResultSheet";
import { ModernResultSheet } from "@/templates/ModernResultSheet";
import { HybridResultSheet } from "@/templates/HybridResultSheet";

interface ApiComputedResult {
  student: Student;
  scores: Score[];
  psychometricAssessment: PsychometricAssessment | null;
  comment: ResultComment | null;
  totalScore: number;
  totalPossible: number;
  percentage: number;
  position: number;
  totalStudents: number;
  classHighest: number;
  classAverage: number;
  term: string;
  academicYear: string;
}

function toStudentResult(
  r: ApiComputedResult,
  term: Term,
  subjects: Subject[],
): StudentResult {
  return {
    student: r.student,
    scores: r.scores.map((s) => ({
      ...s,
      subjectId: subjects.find((sub) => sub.id === s.subjectId)?.name ?? s.subjectId,
      term,
      academicYear: r.academicYear,
    })),
    psychometricAssessment: r.psychometricAssessment ?? undefined,
    comment: r.comment ?? undefined,
    totalScore: r.totalScore,
    totalPossible: r.totalPossible,
    percentage: r.percentage,
    position: r.position,
    totalStudents: r.totalStudents,
    classHighest: r.classHighest,
    classAverage: r.classAverage,
    term,
    academicYear: r.academicYear,
  };
}

function TemplateResultSheet({
  result,
  school,
  subjects,
  term,
  watermarked = false,
}: {
  result: ApiComputedResult;
  school: School;
  subjects: Subject[];
  term: Term;
  watermarked?: boolean;
}) {
  const studentResult = toStudentResult(result, term, subjects);
  switch (school.templateId) {
    case "modern":
      return <ModernResultSheet result={studentResult} school={school} watermarked={watermarked} />;
    case "hybrid":
      return <HybridResultSheet result={studentResult} school={school} watermarked={watermarked} />;
    default:
      return <ClassicResultSheet result={studentResult} school={school} watermarked={watermarked} />;
  }
}

// Generates a watermarked HTML page for preview in a new tab — no download
function buildWatermarkedHTML(
  result: ApiComputedResult,
  school: School,
  subjects: Subject[],
  term: Term,
): string {
  const studentResult = toStudentResult(result, term, subjects);
  let markup: string;
  switch (school.templateId) {
    case "modern":
      markup = renderToStaticMarkup(
        <ModernResultSheet result={studentResult} school={school} watermarked={true} />
      );
      break;
    case "hybrid":
      markup = renderToStaticMarkup(
        <HybridResultSheet result={studentResult} school={school} watermarked={true} />
      );
      break;
    default:
      markup = renderToStaticMarkup(
        <ClassicResultSheet result={studentResult} school={school} watermarked={true} />
      );
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Preview — ${result.student.lastName} ${result.student.firstName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f0f0; display: flex; flex-direction: column; align-items: center; padding: 20px; font-family: sans-serif; }
    .notice { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 20px; margin-bottom: 16px; font-size: 13px; color: #92400e; max-width: 794px; width: 100%; text-align: center; }
    .notice strong { display: block; font-size: 14px; margin-bottom: 4px; }
    @page { size: A4 portrait; margin: 0; }
    @media print { body { background: white; padding: 0; } .notice { display: none; } }
  </style>
</head>
<body>
  <div class="notice">
    <strong>⚠ Unofficial Preview Copy</strong>
    Official result sheets are issued exclusively through the Skora Parent Portal.
    Contact your school bursar to purchase a result access card.
  </div>
  ${markup}
</body>
</html>`;
}

const formatPosition = (pos: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = pos % 100;
  return pos + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });
};

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const DownloadsPage = () => {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId ?? "";

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTerm = useMemo<Term>(() => {
    const t = searchParams.get("term");
    return t === "first" || t === "second" || t === "third" ? t : getCurrentTerm();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const initialYear = useMemo<string>(() => {
    return searchParams.get("academicYear") ?? getCurrentAcademicYear();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedTerm, setSelectedTerm] = useState<Term>(initialTerm);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);

  useEffect(() => {
    setSearchParams(
      { term: selectedTerm, academicYear: selectedYear },
      { replace: true },
    );
  }, [selectedTerm, selectedYear, setSearchParams]);

  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [approvedStatuses, setApprovedStatuses] = useState<ClassResult[]>([]);
  const [classResults, setClassResults] = useState<ApiComputedResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    const yearParam = encodeURIComponent(selectedYear);
    Promise.all([
      api.get<School>(`/schools/${schoolId}`),
      api.get<Class[]>(`/schools/${schoolId}/classes`),
      api.get<ClassResult[]>(
        `/schools/${schoolId}/results?status=approved&term=${selectedTerm}&academicYear=${yearParam}`,
      ),
    ])
      .then(([schoolData, classesData, statusesData]) => {
        setSchool(schoolData);
        setClasses(classesData);
        setApprovedStatuses(statusesData);
        if (selectedClassId && !statusesData.some((s) => s.classId === selectedClassId)) {
          setSelectedClassId("");
          setClassResults([]);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId, selectedTerm, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedClassId || !schoolId) {
      setClassResults([]);
      setSubjects([]);
      return;
    }
    setLoadingResults(true);
    const yearParam = encodeURIComponent(selectedYear);
    Promise.all([
      api.get<ApiComputedResult[]>(
        `/schools/${schoolId}/results/${selectedClassId}/computed?term=${selectedTerm}&academicYear=${yearParam}`,
      ),
      api.get<Subject[]>(`/schools/${schoolId}/classes/${selectedClassId}/subjects`),
    ])
      .then(([results, subjectsData]) => {
        setClassResults(results);
        setSubjects(subjectsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingResults(false));
  }, [selectedClassId, schoolId, selectedTerm, selectedYear]);

  const isArchive =
    selectedTerm !== getCurrentTerm() || selectedYear !== getCurrentAcademicYear();

  const selectedStatus = approvedStatuses.find((r) => r.classId === selectedClassId);

  // Preview a single student result in a new tab — watermarked
  const handlePreview = (result: ApiComputedResult) => {
    if (!school) return;

    // Gate: principal comment must exist before preview
    if (!result.comment?.principalComment?.trim()) {
      setError(
        `Cannot preview — principal comment missing for ${result.student.lastName} ${result.student.firstName}. Go to Approvals to write comments first.`
      );
      return;
    }

    setPreviewingId(result.student.id);
    try {
      const html = buildWatermarkedHTML(result, school, subjects, selectedTerm);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } finally {
      setPreviewingId(null);
    }
  };

  // Check all students have principal comments
  const missingComments = classResults.filter(
    (r) => !r.comment?.principalComment?.trim()
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Result Previews
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Preview watermarked copies of approved results. Parents collect official copies via scratch cards on the parent portal.
            </p>
          </div>
          <Link
            to="/principal/settings"
            className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex-shrink-0"
          >
            <Icon name="style" className="text-base" /> Manage Cards
          </Link>
        </div>

        {/* Term selector */}
        <TermSelector
          term={selectedTerm}
          academicYear={selectedYear}
          onTermChange={setSelectedTerm}
          onAcademicYearChange={setSelectedYear}
        />

        {isArchive && (
          <div className="ledger-card p-4 flex items-start gap-3 border-l-4 border-tertiary-fixed-dim">
            <Icon name="history" className="text-on-tertiary-container flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-on-surface">Archived term</p>
              <p className="text-on-surface-variant mt-0.5">
                Viewing approved results from a previous term for record-keeping.
              </p>
            </div>
          </div>
        )}

        {/* How it works banner */}
        <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-primary/40">
          <Icon name="info" className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-on-surface mb-1">How result distribution works</p>
            <p className="text-on-surface-variant">
              Previews here are watermarked — for your records only. Official clean result sheets are accessed by parents through the{" "}
              <strong>Skora Parent Portal</strong> using scratch cards purchased from your school.
            </p>
            <Link
              to="/principal/settings"
              className="inline-flex items-center gap-1 mt-2 text-primary font-bold hover:underline text-xs"
            >
              <Icon name="style" className="text-sm" /> Request a scratch card batch →
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
            <Icon name="warning" className="flex-shrink-0 mt-0.5 text-base" />
            <div>
              {error}
              {error.includes('Approvals') && (
                <Link to="/principal/approvals" className="block mt-1 font-bold underline">
                  Go to Approvals →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* No approved results */}
        {approvedStatuses.length === 0 ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="inbox" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">No approved results for this term</p>
            <p className="text-sm mt-1">
              {isArchive
                ? "Nothing was approved for the selected term and academic year."
                : "Approve results on the Approvals page to view previews here"}
            </p>
            {!isArchive && (
              <Link to="/principal/approvals" className="mt-4 btn-primary text-sm flex items-center gap-2">
                <Icon name="verified" className="text-base" /> Go to Approvals
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Class selector */}
            <div className="ledger-card p-5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Select Approved Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setError(null); }}
                className="input-inset"
              >
                <option value="">— Choose a class —</option>
                {approvedStatuses.map((s) => (
                  <option key={s.classId} value={s.classId}>
                    {s.className} — approved {formatDate(s.approvedAt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected class */}
            {selectedStatus && selectedClassId && (
              <>
                {/* Class info */}
                <div className="ledger-card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-headline font-bold text-xl text-primary">
                          {selectedStatus.className}
                        </h3>
                        <span className="badge-validated">Approved</span>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        {selectedTerm === "first" ? "1st" : selectedTerm === "second" ? "2nd" : "3rd"} Term · {selectedYear} ·{" "}
                        {loadingResults ? "…" : classResults.length} students · Teacher: {selectedStatus.teacherName}
                      </p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">
                        Approved {formatDate(selectedStatus.approvedAt)}
                      </p>
                    </div>

                    {/* Class summary download — aggregate only, no watermark needed */}
                    <button
                      disabled={loadingResults || classResults.length === 0}
                      onClick={() => {
                        // Generate a simple text summary for principal's records
                        const lines = [
                          `CLASS SUMMARY REPORT`,
                          `${selectedStatus.className} — ${selectedTerm.toUpperCase()} TERM ${selectedYear}`,
                          `Teacher: ${selectedStatus.teacherName}`,
                          `Total Students: ${classResults.length}`,
                          `Approved: ${formatDate(selectedStatus.approvedAt)}`,
                          ``,
                          `POSITION  NAME                          SCORE     %`,
                          `${'─'.repeat(60)}`,
                          ...classResults
                            .sort((a, b) => a.position - b.position)
                            .map((r) =>
                              `${String(r.position).padStart(3, ' ')}.      ${`${r.student.lastName} ${r.student.firstName}`.padEnd(30, ' ')}  ${String(r.totalScore).padStart(5, ' ')}/${r.totalPossible}  ${r.percentage.toFixed(1)}%`
                            ),
                          ``,
                          `Class Average: ${classResults.length > 0 ? (classResults.reduce((s, r) => s + r.percentage, 0) / classResults.length).toFixed(1) : 0}%`,
                          `Class Highest: ${classResults.length > 0 ? Math.max(...classResults.map((r) => r.percentage)).toFixed(1) : 0}%`,
                          ``,
                          `Generated by Skora RMS`,
                        ];
                        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedStatus.className}-Summary-${selectedTerm}-${selectedYear.replace('/', '-')}.txt`;
                        a.click();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                    >
                      <Icon name="summarize" className="text-base" /> Download Class Summary
                    </button>
                  </div>
                </div>

                {/* Missing comments warning */}
                {!loadingResults && missingComments.length > 0 && (
                  <div className="ledger-card p-4 flex items-start gap-3 border-l-4 border-error">
                    <Icon name="warning" className="text-error flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-on-surface">
                        {missingComments.length} student{missingComments.length > 1 ? 's' : ''} missing principal comment
                      </p>
                      <p className="text-on-surface-variant mt-0.5">
                        You cannot preview result sheets until all students have your comment.
                      </p>
                      <Link to="/principal/approvals" className="inline-flex items-center gap-1 mt-2 text-primary font-bold hover:underline text-xs">
                        <Icon name="rate_review" className="text-sm" /> Write comments in Approvals →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Student list */}
                {loadingResults ? (
                  <div className="ledger-card flex items-center justify-center py-16">
                    <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : classResults.length === 0 ? (
                  <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
                    <Icon name="group" className="text-4xl text-outline/30 mb-3" />
                    <p>No student results found for this class</p>
                  </div>
                ) : (
                  <div className="ledger-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-outline-variant/15 bg-surface-container-low flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface-variant">
                        {classResults.length} students — sorted by position
                      </span>
                      <span className="text-xs text-on-surface-variant/60 flex items-center gap-1">
                        <Icon name="lock" className="text-sm" /> Previews are watermarked
                      </span>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {classResults
                        .sort((a, b) => a.position - b.position)
                        .map((result) => {
                          const hasPrincipalComment = !!result.comment?.principalComment?.trim();
                          return (
                            <div
                              key={result.student.id}
                              className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low/50 transition-colors"
                            >
                              {/* Position badge */}
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-primary">
                                  {formatPosition(result.position)}
                                </span>
                              </div>

                              {/* Photo */}
                              {result.student.photoUrl ? (
                                <img
                                  src={result.student.photoUrl}
                                  alt={`${result.student.firstName}`}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-surface-container-highest"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-xs font-bold text-on-surface-variant">
                                  {result.student.firstName[0]}{result.student.lastName[0]}
                                </div>
                              )}

                              {/* Student info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-on-surface text-sm">
                                  {result.student.lastName} {result.student.firstName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs text-on-surface-variant/60">
                                    {result.student.admissionNumber}
                                  </span>
                                  <span className="text-xs text-on-surface-variant/40">·</span>
                                  <span className={`text-xs font-bold ${
                                    result.percentage >= 75 ? "text-secondary"
                                    : result.percentage >= 50 ? "text-primary"
                                    : result.percentage >= 40 ? "text-tertiary"
                                    : "text-error"
                                  }`}>
                                    {result.percentage.toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-on-surface-variant/40">·</span>
                                  <span className="text-xs text-on-surface-variant">
                                    {result.totalScore}/{result.totalPossible}
                                  </span>
                                </div>
                              </div>

                              {/* Comment status */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                hasPrincipalComment
                                  ? 'badge-validated'
                                  : 'bg-error-container text-on-error-container'
                              }`}>
                                {hasPrincipalComment ? 'Commented' : 'No Comment'}
                              </span>

                              {/* Preview button — only when comment exists */}
                              <button
                                onClick={() => handlePreview(result)}
                                disabled={!hasPrincipalComment || previewingId === result.student.id}
                                title={hasPrincipalComment ? 'Preview watermarked copy' : 'Write principal comment first'}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-outline-variant/30 rounded-xl hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                <Icon name="visibility" className="text-sm" />
                                Preview
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};