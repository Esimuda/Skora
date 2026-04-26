import { renderToStaticMarkup } from "react-dom/server";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useDataStore,
  ComputedStudentResult,
  SchoolInfo,
  Subject,
} from "@/store/dataStore";
import { Term, StudentResult, School, PsychometricRating } from "@/types";
import { ClassicResultSheet } from "@/templates/ClassicResultSheet";
import { ModernResultSheet } from "@/templates/ModernResultSheet";
import { HybridResultSheet } from "@/templates/HybridResultSheet";

const CURRENT_TERM: Term = "first";
const CURRENT_YEAR = "2024/2025";

// ── Adapters ─────────────────────────────────────────────────────────────────
// Convert store types to the types the template components expect.

function toStudentResult(
  r: ComputedStudentResult,
  term: Term,
  academicYear: string,
  subjects: Subject[],
  className: string,
): StudentResult {
  return {
    student: {
      ...r.student,
      classId: className,
      createdAt: "",
      updatedAt: "",
    },
    scores: r.scores.map((s) => ({
      id: `${s.studentId}_${s.subjectId}`,
      studentId: s.studentId,
      subjectId: subjects.find((sub) => sub.id === s.subjectId)?.name ?? s.subjectId,
      term,
      academicYear,
      ca1: s.ca1,
      ca2: s.ca2,
      exam: s.exam,
      total: s.total,
      grade: s.grade,
      remark: s.remark,
      createdAt: "",
      updatedAt: "",
    })),
    psychometricAssessment: r.psychometric
      ? {
          id: `psych_${r.psychometric.studentId}`,
          studentId: r.psychometric.studentId,
          classId: r.psychometric.classId,
          term: r.psychometric.term,
          academicYear: r.psychometric.academicYear,
          ratings: r.psychometric.ratings as Record<string, PsychometricRating>,
          createdAt: "",
          updatedAt: "",
        }
      : undefined,
    comment: r.comment
      ? {
          id: `comment_${r.comment.studentId}`,
          studentId: r.comment.studentId,
          classId: r.comment.classId,
          term: r.comment.term,
          academicYear: r.comment.academicYear,
          teacherComment: r.comment.teacherComment,
          principalComment: r.comment.principalComment,
          createdAt: "",
          updatedAt: "",
        }
      : undefined,
    totalScore: r.totalScore,
    totalPossible: r.totalPossible,
    percentage: r.percentage,
    position: r.position,
    totalStudents: r.totalStudents,
    classHighest: r.classHighest,
    classAverage: r.classAverage,
    term,
    academicYear,
  };
}

function toSchool(info: SchoolInfo): School {
  return {
    id: info.id,
    name: info.name,
    address: info.address,
    email: info.email,
    phoneNumber: info.phoneNumber,
    motto: info.motto,
    logo: info.logo,
    principalName: info.principalName,
    website: info.website,
    state: info.state,
    lga: info.lga,
    schoolType: info.schoolType,
    templateId: info.templateId,
    createdAt: "",
    updatedAt: "",
  };
}

// ── Template-aware React component (used in the print zone) ───────────────────

function TemplateResultSheet({
  result,
  schoolInfo,
  subjects,
  className,
}: {
  result: ComputedStudentResult;
  schoolInfo: SchoolInfo;
  subjects: Subject[];
  className: string;
}) {
  const studentResult = toStudentResult(result, CURRENT_TERM, CURRENT_YEAR, subjects, className);
  const school = toSchool(schoolInfo);

  switch (schoolInfo.templateId) {
    case "modern":
      return <ModernResultSheet result={studentResult} school={school} />;
    case "hybrid":
      return <HybridResultSheet result={studentResult} school={school} />;
    default:
      return <ClassicResultSheet result={studentResult} school={school} />;
  }
}

// ── HTML builder (used for new-tab printing and ZIP download) ─────────────────
// Uses renderToStaticMarkup so the correct template component determines the HTML.

function buildResultHTML(
  result: ComputedStudentResult,
  schoolInfo: SchoolInfo,
  subjects: Subject[],
  className: string,
): string {
  const studentResult = toStudentResult(result, CURRENT_TERM, CURRENT_YEAR, subjects, className);
  const school = toSchool(schoolInfo);

  let markup: string;
  switch (schoolInfo.templateId) {
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
    @media print {
      body { background: white; padding: 0; }
      @page { size: A4 portrait; margin: 0; }
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
// Renders the correct template component into a hidden DOM node, captures it
// with html2canvas, and converts the canvas to an A4 PDF blob.

async function generateStudentPDF(
  result: ComputedStudentResult,
  schoolInfo: SchoolInfo,
  subjects: Subject[],
  className: string,
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:794px;background:white;";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);

  // flushSync forces a synchronous DOM update so html2canvas sees the full render
  flushSync(() => {
    root.render(
      <TemplateResultSheet
        result={result}
        schoolInfo={schoolInfo}
        subjects={subjects}
        className={className}
      />,
    );
  });

  // Brief pause so any embedded images (logo, passport photo) can finish loading
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
  const { school, classes, resultStatuses, computeClassResults, getSubjectsByClass } =
    useDataStore();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [zipping, setZipping] = useState(false);

  const approvedStatuses = resultStatuses.filter(
    (r) =>
      r.status === "approved" &&
      r.term === CURRENT_TERM &&
      r.academicYear === CURRENT_YEAR,
  );

  const selectedStatus = approvedStatuses.find((r) => r.classId === selectedClassId);
  const classResults = selectedClassId
    ? computeClassResults(selectedClassId, CURRENT_TERM, CURRENT_YEAR)
    : [];

  const schoolInfo: SchoolInfo = school ?? {
    id: "default",
    name: "School Name",
    address: "School Address",
    email: "school@email.com",
    phoneNumber: "0800000000",
    templateId: "classic",
  };

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name ?? classId;

  const openResultInNewTab = (result: ComputedStudentResult) => {
    const subjects = getSubjectsByClass(result.student.classId);
    const className = getClassName(result.student.classId);
    const html = buildResultHTML(result, schoolInfo, subjects, className);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadZip = async () => {
    if (classResults.length === 0) return;
    setZipping(true);

    const zip = new JSZip();
    const subjects = getSubjectsByClass(selectedClassId);
    const className = getClassName(selectedClassId);
    const safeName = className.replace(/\s+/g, "_");

    // All PDFs go into one flat folder inside the ZIP
    const folder = zip.folder(safeName)!;

    for (const result of classResults) {
      const pdfBlob = await generateStudentPDF(result, schoolInfo, subjects, className);
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface">Downloads</h1>
          <p className="text-on-surface-variant mt-1">
            Print result sheets for approved classes using the{" "}
            <span className="font-semibold capitalize text-primary">
              {schoolInfo.templateId}
            </span>{" "}
            template
          </p>
        </div>

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
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                }}
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
                        First Term · {CURRENT_YEAR} · {classResults.length} students ·
                        Teacher: {selectedStatus.teacherName}
                      </p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">
                        Approved on {formatDate(selectedStatus.approvedAt)}
                      </p>
                      {selectedStatus.principalComment && (
                        <p className="text-sm text-on-secondary-container mt-1 italic">
                          Your comment: "{selectedStatus.principalComment}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                      <button
                        onClick={handlePrintAll}
                        disabled={classResults.length === 0}
                        className="btn-ghost text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">print</span>
                        Print All
                      </button>
                      <button
                        onClick={handleDownloadZip}
                        disabled={classResults.length === 0 || zipping}
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
                {classResults.length === 0 ? (
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
                                result.psychometric
                                  ? "bg-secondary-container/40 text-on-secondary-container"
                                  : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                              }`}
                            >
                              🧠 {result.psychometric ? "✓" : "—"}
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

                {/* Print zone — hidden on screen, used as React-rendered template preview */}
                <div style={{ display: "none" }} aria-hidden>
                  {classResults.map((result) => (
                    <TemplateResultSheet
                      key={result.student.id}
                      result={result}
                      schoolInfo={schoolInfo}
                      subjects={getSubjectsByClass(selectedClassId)}
                      className={getClassName(selectedClassId)}
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
