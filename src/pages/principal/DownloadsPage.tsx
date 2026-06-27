import { renderToStaticMarkup } from "react-dom/server";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
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
  DownloadUnlock,
  PinUsageDetail,
} from "@/types";
import { ClassicResultSheet } from "@/templates/ClassicResultSheet";
import { ModernResultSheet } from "@/templates/ModernResultSheet";
import { HybridResultSheet } from "@/templates/HybridResultSheet";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// Generates a watermarked HTML page for preview in a new tab
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
      markup = renderToStaticMarkup(<ModernResultSheet result={studentResult} school={school} watermarked={true} />);
      break;
    case "hybrid":
      markup = renderToStaticMarkup(<HybridResultSheet result={studentResult} school={school} watermarked={true} />);
      break;
    default:
      markup = renderToStaticMarkup(<ClassicResultSheet result={studentResult} school={school} watermarked={true} />);
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

// Renders one student result to a PDF blob using html2canvas
async function generateStudentPDF(
  result: ApiComputedResult,
  school: School,
  subjects: Subject[],
  term: Term,
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:794px;background:white;";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  flushSync(() => {
    root.render(
      <TemplateResultSheet result={result} school={school} subjects={subjects} term={term} />,
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

  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (canvas.height * pdfW) / canvas.width;
  pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
  return pdf.output("blob");
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

const PER_CLASS_UNIT = 1_000;
const WHOLE_SCHOOL_UNIT = 700;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab] = useState<"previews" | "physical" | "online">("previews");

  useEffect(() => {
    setSearchParams({ term: selectedTerm, academicYear: selectedYear }, { replace: true });
  }, [selectedTerm, selectedYear, setSearchParams]);

  // ── Core data ──────────────────────────────────────────────────────────────
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

  // ── Physical downloads state ───────────────────────────────────────────────
  const [unlocks, setUnlocks] = useState<DownloadUnlock[]>([]);
  const [physicalClassId, setPhysicalClassId] = useState("");
  const [physicalScope, setPhysicalScope] = useState<"class" | "school">("class");
  const [requestingUnlock, setRequestingUnlock] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const [unlocksError, setUnlocksError] = useState<string | null>(null);

  // ── Fetch core data on term change ─────────────────────────────────────────
  // Deliberately does NOT include the download-unlocks fetch — that lives in
  // its own effect below. If they were bundled in one Promise.all, a failure
  // fetching unlocks would wipe out school/classes/approvedStatuses too,
  // since Promise.all rejects (and skips ALL .then state updates) the moment
  // any single request fails. That would break class selection and previews
  // even though those endpoints succeeded fine.
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

  // ── Fetch download unlocks separately ───────────────────────────────────────
  // Isolated on purpose — see note above. A failure here only disables the
  // Physical Reports tab's unlock state (shown as a small inline warning),
  // it never blocks Previews or class selection.
  useEffect(() => {
    if (!schoolId) return;
    setUnlocksError(null);
    api.get<DownloadUnlock[]>(`/schools/${schoolId}/download-unlocks`)
      .then(setUnlocks)
      .catch((e) => setUnlocksError(e.message ?? "Failed to load download unlock status"));
  }, [schoolId, selectedTerm, selectedYear]);

  // ── Online Reports: PIN usage tracker state ─────────────────────────────────
  const [usageDetail, setUsageDetail] = useState<PinUsageDetail | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageClassFilter, setUsageClassFilter] = useState("");
  const [usageStatusFilter, setUsageStatusFilter] = useState<"" | "used" | "unused" | "exhausted">("");

  const fetchUsage = () => {
    if (!schoolId) return;
    setUsageLoading(true);
    setUsageError(null);
    const yearParam = encodeURIComponent(selectedYear);
    api.get<PinUsageDetail>(`/schools/${schoolId}/batches/usage?term=${selectedTerm}&academicYear=${yearParam}`)
      .then(setUsageDetail)
      .catch((e) => setUsageError(e.message ?? "Failed to load card usage"))
      .finally(() => setUsageLoading(false));
  };

  useEffect(() => {
    if (activeTab === "online") fetchUsage();
  }, [activeTab, schoolId, selectedTerm, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch results for selected class (Previews tab) ────────────────────────
  useEffect(() => {
    if (!selectedClassId || !schoolId) { setClassResults([]); setSubjects([]); return; }
    setLoadingResults(true);
    const yearParam = encodeURIComponent(selectedYear);
    Promise.all([
      api.get<any>(
        `/schools/${schoolId}/results/${selectedClassId}/computed?term=${selectedTerm}&academicYear=${yearParam}`,
      ),
      api.get<Subject[]>(`/schools/${schoolId}/classes/${selectedClassId}/subjects`),
    ])
      .then(([response, subjectsData]) => {
        const results: ApiComputedResult[] = Array.isArray(response)
          ? response
          : (response?.data ?? []);
        setClassResults(results);
        setSubjects(subjectsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingResults(false));
  }, [selectedClassId, schoolId, selectedTerm, selectedYear]);

  const isArchive = selectedTerm !== getCurrentTerm() || selectedYear !== getCurrentAcademicYear();
  const selectedStatus = approvedStatuses.find((r) => r.classId === selectedClassId);
  const missingComments = classResults.filter((r) => !r.comment?.principalComment?.trim());

  // ── Preview a single student result (watermarked) ──────────────────────────
  const handlePreview = (result: ApiComputedResult) => {
    if (!school) return;
    if (!result.comment?.principalComment?.trim()) {
      setError(`Cannot preview — principal comment missing for ${result.student.lastName} ${result.student.firstName}. Go to Approvals to write comments first.`);
      return;
    }
    setPreviewingId(result.student.id);
    try {
      const html = buildWatermarkedHTML(result, school, subjects, selectedTerm);
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } finally {
      setPreviewingId(null);
    }
  };

  // ── Unlock helpers ─────────────────────────────────────────────────────────
  const getActiveUnlock = (scope: "class" | "school", classId?: string): DownloadUnlock | null => {
    // A school-scope unlock covers everything
    const schoolWide = unlocks.find(
      (u) => u.status === "active" && u.term === selectedTerm && u.academicYear === selectedYear && u.scope === "school"
    );
    if (schoolWide) return schoolWide;
    if (scope === "class" && classId) {
      return unlocks.find(
        (u) => u.status === "active" && u.term === selectedTerm && u.academicYear === selectedYear && u.scope === "class" && u.classId === classId
      ) ?? null;
    }
    return null;
  };

  const hasPendingUnlock = (scope: "class" | "school", classId?: string): boolean => {
    if (scope === "school") {
      return unlocks.some((u) => u.status === "pending_payment" && u.term === selectedTerm && u.academicYear === selectedYear && u.scope === "school");
    }
    return unlocks.some((u) => u.status === "pending_payment" && u.term === selectedTerm && u.academicYear === selectedYear && u.scope === "class" && u.classId === classId);
  };

  // ── Request a download unlock ──────────────────────────────────────────────
  const handleRequestUnlock = async (scope: "class" | "school", classId?: string) => {
    if (scope === "class" && !classId) {
      setUnlockError("Please select a class first.");
      return;
    }
    setRequestingUnlock(true);
    setPhysicalScope(scope);
    if (classId) setPhysicalClassId(classId);
    setUnlockError(null);
    setUnlockSuccess(false);
    try {
      const unlock = await api.post<DownloadUnlock>(`/schools/${schoolId}/download-unlocks`, {
        term: selectedTerm,
        academicYear: selectedYear,
        scope,
        ...(scope === "class" ? { classId } : {}),
      });
      setUnlocks((prev) => [unlock, ...prev]);
      setUnlockSuccess(true);
    } catch (e: any) {
      setUnlockError(e.message ?? "Failed to submit request");
    } finally {
      setRequestingUnlock(false);
    }
  };

  // ── Download ZIP for a class ───────────────────────────────────────────────
  const handleDownloadZip = async (targetClassId: string, targetClassName: string) => {
    if (!school || !schoolId) return;

    setZipping(true);
    setZipProgress(0);
    setUnlockError(null);

    try {
      const yearParam = encodeURIComponent(selectedYear);
      const [response, subjectsData] = await Promise.all([
        api.get<any>(
          `/schools/${schoolId}/results/${targetClassId}/computed?term=${selectedTerm}&academicYear=${yearParam}`,
        ),
        api.get<Subject[]>(`/schools/${schoolId}/classes/${targetClassId}/subjects`),
      ]);

      const results: ApiComputedResult[] = Array.isArray(response) ? response : (response?.data ?? []);

      if (results.length === 0) {
        setUnlockError("No approved results found for this class.");
        return;
      }

      const zip = new JSZip();
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const lastName = result.student.lastName.replace(/[^a-zA-Z0-9]/g, "_");
        const firstName = result.student.firstName.replace(/[^a-zA-Z0-9]/g, "_");
        const serial = String(result.position).padStart(3, "0");
        const pdfBlob = await generateStudentPDF(result, school, subjectsData, selectedTerm);
        zip.file(`${serial}_${lastName}_${firstName}.pdf`, pdfBlob);
        setZipProgress(Math.round(((i + 1) / results.length) * 100));
      }

      const safeClassName = targetClassName.replace(/[^a-zA-Z0-9]/g, "_");
      const termTag = selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${safeClassName}_${termTag}-Term_${selectedYear.replace("/", "-")}.zip`);
    } catch (e: any) {
      setUnlockError(e.message ?? "Failed to generate ZIP");
    } finally {
      setZipping(false);
      setZipProgress(0);
    }
  };

  // ── Pricing calculation ────────────────────────────────────────────────────
  const getPrice = (scope: "class" | "school", classId?: string): { students: number; total: number; unit: number } => {
    if (scope === "school") {
      const total = classes.reduce((s, c) => s + (c.studentCount ?? 0), 0);
      return { students: total, unit: WHOLE_SCHOOL_UNIT, total: total * WHOLE_SCHOOL_UNIT };
    }
    const cls = classes.find((c) => c.id === classId);
    const students = cls?.studentCount ?? 0;
    return { students, unit: PER_CLASS_UNIT, total: students * PER_CLASS_UNIT };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

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

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Downloads
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Preview watermarked copies or download official physical result sheets.
            </p>
          </div>
          <Link
            to="/principal/settings"
            className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex-shrink-0"
          >
            <Icon name="style" className="text-base" /> Manage Scratch Cards
          </Link>
        </div>

        {/* ── Term selector ── */}
        <TermSelector
          term={selectedTerm}
          academicYear={selectedYear}
          onTermChange={(t) => { setSelectedTerm(t); setSelectedClassId(""); setPhysicalClassId(""); }}
          onAcademicYearChange={(y) => { setSelectedYear(y); setSelectedClassId(""); setPhysicalClassId(""); }}
        />

        {isArchive && (
          <div className="ledger-card p-4 flex items-start gap-3 border-l-4 border-tertiary-fixed-dim">
            <Icon name="history" className="text-on-tertiary-container flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-on-surface">Archived term</p>
              <p className="text-on-surface-variant mt-0.5">Viewing approved results from a previous term.</p>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 bg-surface-container rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("previews")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "previews"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="visibility" className="text-base" /> Previews
          </button>
          <button
            onClick={() => setActiveTab("physical")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "physical"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="sim_card_download" className="text-base" /> Physical Reports
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "online"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="qr_code_scanner" className="text-base" /> Online Reports
          </button>
        </div>

        {/* ── Global error ── */}
        {error && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
            <Icon name="warning" className="flex-shrink-0 mt-0.5 text-base" />
            <div>
              {error}
              {error.includes("Approvals") && (
                <Link to="/principal/approvals" className="block mt-1 font-bold underline">
                  Go to Approvals →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PREVIEWS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "previews" && (
          <>
            <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-primary/40">
              <Icon name="info" className="text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-on-surface mb-1">Previews are watermarked</p>
                <p className="text-on-surface-variant">
                  These copies are for your reference only. Official clean result sheets are accessed by parents through the{" "}
                  <strong>Skora Parent Portal</strong> using scratch cards.
                </p>
                <Link to="/principal/settings" className="inline-flex items-center gap-1 mt-2 text-primary font-bold hover:underline text-xs">
                  <Icon name="style" className="text-sm" /> Request a scratch card batch →
                </Link>
              </div>
            </div>

            {approvedStatuses.length === 0 ? (
              <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
                <Icon name="inbox" className="text-5xl text-outline/30 mb-4" />
                <p className="font-headline font-bold text-lg">No approved results for this term</p>
                <p className="text-sm mt-1">
                  {isArchive ? "Nothing was approved for the selected term." : "Approve results on the Approvals page to view previews here"}
                </p>
                {!isArchive && (
                  <Link to="/principal/approvals" className="mt-4 btn-primary text-sm flex items-center gap-2">
                    <Icon name="verified" className="text-base" /> Go to Approvals
                  </Link>
                )}
              </div>
            ) : (
              <>
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

                {selectedStatus && selectedClassId && (
                  <>
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
                            {loadingResults ? "…" : classResults.length} students · Teacher: {selectedStatus.teacherName}
                          </p>
                          <p className="text-xs text-on-surface-variant/60 mt-1">
                            Approved {formatDate(selectedStatus.approvedAt)}
                          </p>
                        </div>
                        <button
                          disabled={loadingResults || classResults.length === 0}
                          onClick={() => {
                            const lines = [
                              `CLASS SUMMARY REPORT`,
                              `${selectedStatus.className} — ${selectedTerm.toUpperCase()} TERM ${selectedYear}`,
                              `Teacher: ${selectedStatus.teacherName}`,
                              `Total Students: ${classResults.length}`,
                              ``,
                              `POSITION  NAME                          SCORE     %`,
                              `${"─".repeat(60)}`,
                              ...classResults
                                .sort((a, b) => a.position - b.position)
                                .map((r) => `${String(r.position).padStart(3, " ")}.      ${`${r.student.lastName} ${r.student.firstName}`.padEnd(30, " ")}  ${String(r.totalScore).padStart(5, " ")}/${r.totalPossible}  ${r.percentage.toFixed(1)}%`),
                              ``,
                              `Class Average: ${classResults.length > 0 ? (classResults.reduce((s, r) => s + r.percentage, 0) / classResults.length).toFixed(1) : 0}%`,
                              `Generated by Skora RMS`,
                            ];
                            const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `${selectedStatus.className}-Summary-${selectedTerm}-${selectedYear.replace("/", "-")}.txt`;
                            a.click();
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                        >
                          <Icon name="summarize" className="text-base" /> Download Class Summary
                        </button>
                      </div>
                    </div>

                    {!loadingResults && missingComments.length > 0 && (
                      <div className="ledger-card p-4 flex items-start gap-3 border-l-4 border-error">
                        <Icon name="warning" className="text-error flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-bold text-on-surface">
                            {missingComments.length} student{missingComments.length > 1 ? "s" : ""} missing principal comment
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
                                <div key={result.student.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low/50 transition-colors">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">{formatPosition(result.position)}</span>
                                  </div>
                                  {result.student.photoUrl ? (
                                    <img src={result.student.photoUrl} alt={result.student.firstName} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-surface-container-highest" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-xs font-bold text-on-surface-variant">
                                      {result.student.firstName[0]}{result.student.lastName[0]}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-on-surface text-sm">
                                      {result.student.lastName} {result.student.firstName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="text-xs text-on-surface-variant/60">{result.student.admissionNumber}</span>
                                      <span className="text-xs text-on-surface-variant/40">·</span>
                                      <span className={`text-xs font-bold ${result.percentage >= 75 ? "text-secondary" : result.percentage >= 50 ? "text-primary" : result.percentage >= 40 ? "text-tertiary" : "text-error"}`}>
                                        {result.percentage.toFixed(1)}%
                                      </span>
                                      <span className="text-xs text-on-surface-variant/40">·</span>
                                      <span className="text-xs text-on-surface-variant">{result.totalScore}/{result.totalPossible}</span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${hasPrincipalComment ? "badge-validated" : "bg-error-container text-on-error-container"}`}>
                                    {hasPrincipalComment ? "Commented" : "No Comment"}
                                  </span>
                                  <button
                                    onClick={() => handlePreview(result)}
                                    disabled={!hasPrincipalComment || previewingId === result.student.id}
                                    title={hasPrincipalComment ? "Preview watermarked copy" : "Write principal comment first"}
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
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PHYSICAL COPIES
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "physical" && (
          <>
            {/* How it works */}
            <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-secondary/40">
              <Icon name="print" className="text-secondary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-on-surface mb-1">Physical result sheets</p>
                <p className="text-on-surface-variant">
                  Download a ZIP file of individual PDF result sheets — one per student — ready to print and hand out on closing day.
                  Pay once per term and re-download as many times as you need.
                </p>
                <div className="flex items-center gap-6 mt-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><Icon name="school" className="text-sm" /> Per class: <strong className="text-on-surface">₦{PER_CLASS_UNIT.toLocaleString()} / student</strong></span>
                  <span className="flex items-center gap-1.5"><Icon name="apartment" className="text-sm" /> Whole school: <strong className="text-on-surface">₦{WHOLE_SCHOOL_UNIT.toLocaleString()} / student</strong></span>
                </div>
              </div>
            </div>

            {unlocksError && (
              <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
                <Icon name="warning" className="flex-shrink-0 mt-0.5 text-base" />
                <div className="flex-1">
                  <p className="font-bold">Couldn't load your download access status</p>
                  <p className="mt-0.5">{unlocksError}</p>
                </div>
                <button
                  onClick={() => {
                    setUnlocksError(null);
                    api.get<DownloadUnlock[]>(`/schools/${schoolId}/download-unlocks`)
                      .then(setUnlocks)
                      .catch((e) => setUnlocksError(e.message ?? "Failed to load download unlock status"));
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-error text-on-error text-xs font-bold hover:bg-error/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {unlockError && (
              <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
                <Icon name="warning" className="flex-shrink-0 mt-0.5 text-base" />
                {unlockError}
              </div>
            )}

            {unlockSuccess && (
              <div className="rounded-xl bg-secondary-container text-on-secondary-container px-4 py-3 text-sm flex items-start gap-2">
                <Icon name="check_circle" className="flex-shrink-0 mt-0.5 text-base" />
                <div>
                  <p className="font-bold">Request submitted!</p>
                  <p className="mt-0.5">Once your payment is confirmed, Skora will activate your download access and email you. Typically within 24 hours on business days.</p>
                </div>
              </div>
            )}

            {/* ── Whole school unlock card ── */}
            {(() => {
              const schoolUnlock = getActiveUnlock("school");
              const schoolPending = hasPendingUnlock("school");
              const price = getPrice("school");
              return (
                <div className="ledger-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-outline-variant/15 bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name="apartment" className="text-primary text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Entire School</p>
                        <p className="text-xs text-on-surface-variant">{price.students} students · ₦{WHOLE_SCHOOL_UNIT.toLocaleString()}/student · best value</p>
                      </div>
                    </div>
                    {schoolUnlock ? (
                      <span className="badge-validated text-xs">Unlocked</span>
                    ) : schoolPending ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">Pending Payment</span>
                    ) : null}
                  </div>

                  <div className="p-5">
                    {schoolUnlock ? (
                      // UNLOCKED — show per-class download buttons
                      <>
                        <p className="text-sm text-on-surface-variant mb-4">
                          Download access is active for <strong>{selectedTerm} term {selectedYear}</strong>. Select a class below to download.
                        </p>
                        {approvedStatuses.length === 0 ? (
                          <p className="text-sm text-on-surface-variant/60">No approved classes for this term yet.</p>
                        ) : (
                          <div className="divide-y divide-outline-variant/10 rounded-xl border border-outline-variant/15 overflow-hidden">
                            {approvedStatuses.map((s) => {
                              const cls = classes.find((c) => c.id === s.classId);
                              return (
                                <div key={s.classId} className="flex items-center justify-between gap-4 px-4 py-3">
                                  <div>
                                    <p className="font-bold text-sm text-on-surface">{s.className}</p>
                                    <p className="text-xs text-on-surface-variant">{cls?.studentCount ?? "?"} students · Teacher: {s.teacherName}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDownloadZip(s.classId, s.className)}
                                    disabled={zipping}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50"
                                  >
                                    {zipping ? (
                                      <>
                                        <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        {zipProgress > 0 ? `${zipProgress}%` : "Preparing…"}
                                      </>
                                    ) : (
                                      <><Icon name="sim_card_download" className="text-sm" /> Download ZIP</>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : schoolPending ? (
                      <div className="text-sm text-on-surface-variant">
                        <p>Your request is pending payment confirmation. Skora will activate access within 24 hours after payment.</p>
                        <p className="mt-2 font-bold text-on-surface">Amount due: ₦{price.total.toLocaleString()}</p>
                        <p className="text-xs mt-1">Transfer to Skora and include your school name as the payment reference.</p>
                      </div>
                    ) : (
                      // NOT REQUESTED YET
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Download result sheets for all <strong>{price.students} students</strong> across all classes.
                          </p>
                          <p className="text-lg font-extrabold text-primary mt-1">
                            ₦{price.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            ₦{WHOLE_SCHOOL_UNIT.toLocaleString()} × {price.students} students — 30% cheaper than per-class
                          </p>
                        </div>
                        <button
                          onClick={() => handleRequestUnlock("school")}
                          disabled={requestingUnlock && physicalScope === "school"}
                          className="flex items-center gap-2 px-5 py-3 btn-primary text-sm font-bold rounded-xl disabled:opacity-50"
                        >
                          {requestingUnlock && physicalScope === "school" ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Requesting…</>
                          ) : (
                            <><Icon name="lock_open" className="text-base" /> Request Unlock</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Per-class unlock cards ── */}
            <div className="ledger-card overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant/15 bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Icon name="school" className="text-secondary text-lg" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">Per Class</p>
                    <p className="text-xs text-on-surface-variant">₦{PER_CLASS_UNIT.toLocaleString()} per student · unlock one class at a time</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {approvedStatuses.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/60">No approved classes for this term yet.</p>
                ) : (
                  approvedStatuses.map((s) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    const classUnlock = getActiveUnlock("class", s.classId);
                    const classPending = hasPendingUnlock("class", s.classId);
                    // A whole-school unlock also covers this class
                    const schoolWide = getActiveUnlock("school");
                    const isUnlocked = !!(classUnlock || schoolWide);
                    const price = getPrice("class", s.classId);

                    return (
                      <div key={s.classId} className="rounded-xl border border-outline-variant/15 overflow-hidden">
                        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-surface-container-low/50">
                          <div>
                            <p className="font-bold text-sm text-on-surface">{s.className}</p>
                            <p className="text-xs text-on-surface-variant">{cls?.studentCount ?? "?"} students · Teacher: {s.teacherName}</p>
                          </div>
                          {isUnlocked ? (
                            <span className="badge-validated text-xs">Unlocked</span>
                          ) : classPending ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">Pending</span>
                          ) : null}
                        </div>

                        <div className="px-4 py-3">
                          {isUnlocked ? (
                            <button
                              onClick={() => handleDownloadZip(s.classId, s.className)}
                              disabled={zipping}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50"
                            >
                              {zipping ? (
                                <><span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> {zipProgress > 0 ? `Generating… ${zipProgress}%` : "Preparing…"}</>
                              ) : (
                                <><Icon name="sim_card_download" className="text-base" /> Download ZIP ({price.students} PDFs)</>
                              )}
                            </button>
                          ) : classPending ? (
                            <p className="text-sm text-on-surface-variant">
                              Pending confirmation · Amount due: <strong className="text-on-surface">₦{price.total.toLocaleString()}</strong>
                            </p>
                          ) : (
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <p className="text-sm text-on-surface-variant">
                                <strong className="text-primary">₦{price.total.toLocaleString()}</strong>
                                <span className="ml-1 text-xs">(₦{PER_CLASS_UNIT.toLocaleString()} × {price.students} students)</span>
                              </p>
                              <button
                                onClick={() => handleRequestUnlock("class", s.classId)}
                                disabled={requestingUnlock}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50"
                              >
                                {requestingUnlock && physicalScope === "class" && physicalClassId === s.classId ? (
                                  <><span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Requesting…</>
                                ) : (
                                  <><Icon name="lock_open" className="text-sm" /> Request Unlock</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Payment instructions */}
            <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-outline-variant/30">
              <Icon name="account_balance" className="text-on-surface-variant flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-on-surface mb-1">How to pay</p>
                <p className="text-on-surface-variant">
                  After submitting a request, transfer the amount to Skora's bank account and use your <strong>school name</strong> as the payment reference.
                  Skora will confirm your payment and activate access — typically within 24 hours on business days.
                  You'll receive an email notification when access is ready.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: ONLINE REPORTS (usage tracker)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "online" && (
          <>
            <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-tertiary-fixed-dim">
              <Icon name="qr_code_scanner" className="text-on-tertiary-container flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-on-surface mb-1">Scratch card usage</p>
                <p className="text-on-surface-variant">
                  Track which scratch cards parents have actually used to view results online, for{" "}
                  <strong>{selectedTerm} term {selectedYear}</strong>. Cards are matched to a student the first time they're scratched —
                  unused cards aren't tied to anyone yet.
                </p>
              </div>
            </div>

            {usageLoading ? (
              <div className="ledger-card flex items-center justify-center py-16">
                <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : usageError ? (
              <div className="ledger-card p-4 border-l-4 border-error flex items-center gap-3">
                <Icon name="error" className="text-error text-base flex-shrink-0" />
                <p className="text-sm text-on-surface flex-1">{usageError}</p>
                <button onClick={fetchUsage} className="px-3 py-1.5 rounded-lg bg-error text-on-error text-sm font-semibold hover:bg-error/90 transition-colors flex-shrink-0">
                  Retry
                </button>
              </div>
            ) : !usageDetail?.hasActiveBatch ? (
              <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
                <Icon name="style" className="text-5xl text-outline/30 mb-4" />
                <p className="font-headline font-bold text-lg">No active scratch card batch</p>
                <p className="text-sm mt-1">There's no active batch for {selectedTerm} term {selectedYear} yet.</p>
                <Link to="/principal/settings" className="mt-4 btn-primary text-sm flex items-center gap-2">
                  <Icon name="style" className="text-base" /> Request a Batch
                </Link>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="ledger-card p-4">
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Total Cards</p>
                    <p className="text-2xl font-extrabold text-on-surface mt-1">{usageDetail.summary.totalPins}</p>
                  </div>
                  <div className="ledger-card p-4">
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Used</p>
                    <p className="text-2xl font-extrabold text-secondary mt-1">{usageDetail.summary.usedPins}</p>
                  </div>
                  <div className="ledger-card p-4">
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Unused</p>
                    <p className="text-2xl font-extrabold text-on-surface-variant mt-1">{usageDetail.summary.unusedPins}</p>
                  </div>
                  <div className="ledger-card p-4">
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Fully Exhausted</p>
                    <p className="text-2xl font-extrabold text-tertiary mt-1">{usageDetail.summary.exhaustedPins}</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={usageStatusFilter}
                    onChange={(e) => setUsageStatusFilter(e.target.value as typeof usageStatusFilter)}
                    className="input-inset w-auto"
                  >
                    <option value="">All Statuses</option>
                    <option value="used">Used</option>
                    <option value="unused">Unused</option>
                    <option value="exhausted">Fully Exhausted</option>
                  </select>
                  <select
                    value={usageClassFilter}
                    onChange={(e) => setUsageClassFilter(e.target.value)}
                    className="input-inset w-auto"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="__unmatched__">Not Yet Matched</option>
                  </select>
                </div>

                {/* Usage list */}
                {(() => {
                  const filtered = usageDetail.pins.filter((p) => {
                    if (usageStatusFilter && p.status !== usageStatusFilter) return false;
                    if (usageClassFilter === "__unmatched__" && p.classId !== null) return false;
                    if (usageClassFilter && usageClassFilter !== "__unmatched__" && p.classId !== usageClassFilter) return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
                        <Icon name="filter_alt_off" className="text-4xl text-outline/30 mb-3" />
                        <p>No cards match this filter</p>
                      </div>
                    );
                  }

                  return (
                    <div className="ledger-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-outline-variant/15 bg-surface-container-low flex items-center justify-between">
                        <span className="text-sm font-bold text-on-surface-variant">
                          {filtered.length} card{filtered.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="divide-y divide-outline-variant/10">
                        {filtered.map((p) => (
                          <div key={p.pinId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container-low/50 transition-colors">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-container-highest">
                              <Icon
                                name={p.status === "unused" ? "lock" : p.status === "exhausted" ? "lock_open" : "check_circle"}
                                className={`text-base ${
                                  p.status === "unused" ? "text-on-surface-variant/50"
                                  : p.status === "exhausted" ? "text-tertiary"
                                  : "text-secondary"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {p.studentName ? (
                                <>
                                  <p className="font-bold text-on-surface text-sm">{p.studentName}</p>
                                  <p className="text-xs text-on-surface-variant">
                                    {p.admissionNumber && `${p.admissionNumber} · `}
                                    {p.className ?? "Unknown class"}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-on-surface-variant italic">Not yet scratched</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-on-surface">
                                {p.usesTotal - p.usesRemaining}/{p.usesTotal} views used
                              </p>
                              {p.lastUsedAt && (
                                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
                                  Last viewed {formatDate(p.lastUsedAt)}
                                </p>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              p.status === "unused" ? "bg-surface-container-highest text-on-surface-variant"
                              : p.status === "exhausted" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                              : "badge-validated"
                            }`}>
                              {p.status === "unused" ? "Unused" : p.status === "exhausted" ? "Exhausted" : "Used"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  );
};
