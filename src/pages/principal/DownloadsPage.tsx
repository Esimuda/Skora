import { renderToStaticMarkup } from "react-dom/server";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Term,
  StudentResult,
  School,
  Subject,
  Class,
  ClassResult,
  PsychometricRating,
  PsychometricAssessment,
  ResultComment,
  Score,
  Student,
} from "@/types";
import { ClassicResultSheet } from "@/templates/ClassicResultSheet";
import { ModernResultSheet } from "@/templates/ModernResultSheet";
import { HybridResultSheet } from "@/templates/HybridResultSheet";

const CURRENT_TERM: Term = "first";
const CURRENT_YEAR = "2024/2025";

// Shape returned by GET /schools/:schoolId/results/:classId/computed
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

// ── Adapter ───────────────────────────────────────────────────────────────────
// Converts the API computed result into the shape the template components expect.
// The key transform: scores[].subjectId is a UUID from the DB — templates need the name.

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

// ── Template-aware React component ────────────────────────────────────────────

function TemplateResultSheet({
  result,
  school,
  subjects,
}: {
  result: ApiComputedResult;
  school: School;
  subjects: Subject[];
}) {
  const studentResult = toStudentResult(result, CURRENT_TERM, subjects);

  switch (school.templateId) {
    case "modern":
      return <ModernResultSheet result={studentResult} school={school} />;
    case "hybrid":
      return <HybridResultSheet result={studentResult} school={school} />;
    default:
      return <ClassicResultSheet result={studentResult} school={school} />;
  }
}

// ── HTML builder (new-tab print) ──────────────────────────────────────────────

function buildResultHTML(
  result: ApiComputedResult,
  school: School,
  subjects: Subject[],
): string {
  const studentResult = toStudentResult(result, CURRENT_TERM, subjects);

  let markup: string;
  switch (school.templateId) {
    case "modern":
      markup = renderToStaticMarkup(<ModernResultSheet result={studentResult} school={school} />);
      break;
    case "hybrid":
      markup = renderToStaticMarkup(<HybridResultSheet result={studentResult} school={school} />);
      break;
    default:
      markup = renderToStaticMarkup(<ClassicResultSheet result={studentResult} school={school} />);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Result — ${result.student.lastName} ${result.student.firstName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { background: white; padding: 0; }
    }
  </style>
</head>
<body>
  ${markup}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

// ── PDF generator ─────────────────────────────────────────────────────────────

async function generateStudentPDF(
  result: ApiComputedResult,
  school: School,
  subjects: Subject[],
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:794px;background:white;";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);

  flushSync(() => {
    root.render(
      <TemplateResultSheet result={result} school={school} subjects={subjects} />,
    );
  });

  await new Promise((r) => setTimeout(r, 200));

  const el = container.firstElementChild as HTMLElement;
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

  root.unmount();
  document.body.removeChild(container);

  return pdf.output("blob");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatPosition = (pos: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = pos % 100;
  return pos + (s[(v - 20) % 10] || s[v] || s[0]);
};

// ── Main Downloads Page ───────────────────────────────────────────────────────

export const DownloadsPage = () => {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId ?? "";

  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [approvedStatuses, setApprovedStatuses] = useState<ClassResult[]>([]);
  const [classResults, setClassResults] = useState<ApiComputedResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: fetch school info, classes, and approved result statuses in parallel
  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.get<School>(`/schools/${schoolId}`),
      api.get<Class[]>(`/schools/${schoolId}/classes`),
      api.get<ClassResult[]>(
        `/schools/${schoolId}/results?status=approved&term=${CURRENT_TERM}&academicYear=${encodeURIComponent(CURRENT_YEAR)}`,
      ),
    ])
      .then(([schoolData, classesData, statusesData]) => {
        setSchool(schoolData);
        setClasses(classesData);
        setApprovedStatuses(statusesData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  // When a class is selected: fetch its computed results and subjects in parallel
  useEffect(() => {
    if (!selectedClassId || !schoolId) {
      setClassResults([]);
      setSubjects([]);
      return;
    }
    setLoadingResults(true);
    Promise.all([
      api.get<ApiComputedResult[]>(
        `/schools/${schoolId}/results/${selectedClassId}/computed?term=${CURRENT_TERM}&academicYear=${encodeURIComponent(CURRENT_YEAR)}`,
      ),
      api.get<Subject[]>(`/schools/${schoolId}/classes/${selectedClassId}/subjects`),
    ])
      .then(([results, subjectsData]) => {
        setClassResults(results);
        setSubjects(subjectsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingResults(false));
  }, [selectedClassId, schoolId]);

  const selectedStatus = approvedStatuses.find((r) => r.classId === selectedClassId);
  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name ?? classId;

  const openResultInNewTab = (result: ApiComputedResult) => {
    if (!school) return;
    const html = buildResultHTML(result, school, subjects);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadZip = async () => {
    if (!school || classResults.length === 0) return;
    setZipping(true);

    const zip = new JSZip();
    const className = getClassName(selectedClassId);
    const safeName = className.replace(/\s+/g, "_");
    const folder = zip.folder(safeName)!;

    for (const result of classResults) {
      const pdfBlob = await generateStudentPDF(result, school, subjects);
      const fileName =
        `${result.student.lastName}_${result.student.firstName}_${result.student.admissionNumber}.pdf`.replace(
          /\s+/g,
          "_",
        );
      folder.file(fileName, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${safeName}_Results_${CURRENT_YEAR.replace("/", "-")}.zip`);
    setZipping(false);
  };

  const handlePrintAll = () => {
    classResults.forEach((result, idx) => {
      setTimeout(() => openResultInNewTab(result), idx * 500);
    });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface">Downloads</h1>
          <p className="text-on-surface-variant mt-1">
            Print result sheets for approved classes using the{" "}
            <span className="font-semibold capitalize text-primary">
              {school?.templateId ?? "classic"}
            </span>{" "}
            template
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-error-container border border-error/20 rounded-xl p-4 text-on-error-container text-sm">
            {error}
          </div>
        )}

        {/* Approval gate info */}
        <div className="mb-6 bg-secondary-container/30 border border-secondary/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-semibold text-on-secondary-container">Approval-gated</p>
            <p className="text-sm text-on-surface-variant">
              Only classes you have approved appear here. Approve results on the
              Approvals page first.
            </p>
          </div>
        </div>

        {/* No approved results yet */}
        {approvedStatuses.length === 0 ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-medium">No approved results yet</p>
            <p className="text-sm mt-1">
              Approve results on the Approvals page to unlock downloads
            </p>
          </div>
        ) : (
          <>
            {/* Class selector */}
            <div className="ledger-card p-4 mb-6">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Select Approved Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
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

            {/* Selected class details */}
            {selectedStatus && selectedClassId && (
              <>
                {/* Class info banner */}
                <div className="ledger-card p-4 md:p-5 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-xl font-bold text-on-surface">
                          {selectedStatus.className}
                        </h2>
                        <span className="badge-validated">✅ Approved</span>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        First Term · {CURRENT_YEAR} ·{" "}
                        {loadingResults ? "…" : classResults.length} students ·
                        Teacher: {selectedStatus.teacherName}
                      </p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">
                        Approved on {formatDate(selectedStatus.approvedAt)}
                      </p>
                      {selectedStatus.principalNote && (
                        <p className="text-sm text-on-secondary-container mt-1 italic">
                          Your note: "{selectedStatus.principalNote}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                      <button
                        onClick={handlePrintAll}
                        disabled={loadingResults || classResults.length === 0}
                        className="btn-ghost text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">print</span>
                        Print All
                      </button>
                      <button
                        onClick={handleDownloadZip}
                        disabled={loadingResults || classResults.length === 0 || zipping}
                        className="btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {zipping ? (
                          <>
                            <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                            Generating PDFs…
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            Download PDFs ({classResults.length})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Student list */}
                {loadingResults ? (
                  <div className="ledger-card flex items-center justify-center py-16">
                    <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : classResults.length === 0 ? (
                  <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
                    <div className="text-4xl mb-3">👥</div>
                    <p>No student results found for this class</p>
                  </div>
                ) : (
                  <div className="ledger-card overflow-hidden mb-6">
                    <div className="px-5 py-3 border-b border-outline-variant/15 bg-surface-container-low">
                      <span className="text-sm font-semibold text-on-surface-variant">
                        {classResults.length} students — sorted by position
                      </span>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {classResults.map((result) => (
                        <div
                          key={result.student.id}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors"
                        >
                          {/* Position badge */}
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {formatPosition(result.position)}
                            </span>
                          </div>

                          {/* Student info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-on-surface">
                              {result.student.lastName} {result.student.firstName}
                              {result.student.middleName
                                ? ` ${result.student.middleName}`
                                : ""}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-on-surface-variant/60">
                                {result.student.admissionNumber}
                              </span>
                              <span className="text-xs text-on-surface-variant/40">·</span>
                              <span
                                className={`text-xs font-bold ${
                                  result.percentage >= 75
                                    ? "text-secondary"
                                    : result.percentage >= 50
                                      ? "text-primary"
                                      : result.percentage >= 40
                                        ? "text-tertiary"
                                        : "text-error"
                                }`}
                              >
                                {result.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-on-surface-variant/40">·</span>
                              <span className="text-xs text-on-surface-variant">
                                {result.totalScore}/{result.totalPossible} marks
                              </span>
                            </div>
                          </div>

                          {/* Completeness indicators */}
                          <div className="flex gap-1.5">
                            <span
                              title="Scores"
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                result.scores.length > 0
                                  ? "bg-secondary-container/40 text-on-secondary-container"
                                  : "bg-error-container text-on-error-container"
                              }`}
                            >
                              📝 {result.scores.length} subj
                            </span>
                            <span
                              title="Psychometric"
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                result.psychometricAssessment
                                  ? "bg-secondary-container/40 text-on-secondary-container"
                                  : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                              }`}
                            >
                              🧠 {result.psychometricAssessment ? "✓" : "—"}
                            </span>
                            <span
                              title="Comment"
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                result.comment?.teacherComment
                                  ? "bg-secondary-container/40 text-on-secondary-container"
                                  : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                              }`}
                            >
                              💬 {result.comment?.teacherComment ? "✓" : "—"}
                            </span>
                          </div>

                          {/* Print button */}
                          <button
                            onClick={() => openResultInNewTab(result)}
                            className="btn-ghost text-xs px-3 py-2.5 flex-shrink-0"
                          >
                            🖨️ Print
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden print zone — pre-renders templates for PDF generation */}
                <div style={{ display: "none" }} aria-hidden>
                  {school &&
                    classResults.map((result) => (
                      <TemplateResultSheet
                        key={result.student.id}
                        result={result}
                        school={school}
                        subjects={subjects}
                      />
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
