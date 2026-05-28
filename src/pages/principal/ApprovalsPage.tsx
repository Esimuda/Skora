import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import {
  TermSelector,
  getCurrentTerm,
  getCurrentAcademicYear,
  Term,
} from "@/components/ui/TermSelector";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
};

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const QUICK_PRINCIPAL_COMMENTS = [
  "Keep up the excellent work. The school is proud of your achievements.",
  "Well done. Continue to strive for greater heights.",
  "Commendable performance. Maintain this standard next term.",
  "Good effort shown this term. We expect even better results next term.",
  "You have shown improvement. Keep working hard.",
  "A satisfactory performance. There is room for improvement next term.",
];

interface ClassResult {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  term: string;
  academicYear: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: string;
  approvedAt?: string;
  principalNote?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface StudentScore {
  subjectId: string;
  subjectName?: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  grade: string;
}

interface ComputedStudent {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  scores: StudentScore[];
  comment: { teacherComment?: string; principalComment?: string } | null;
  totalScore: number;
  totalPossible: number;
  percentage: number;
  position: number;
  totalStudents: number;
  classHighest: number;
  classAverage: number;
}

export const ApprovalsPage = () => {
  const user = useAuthStore((s) => s.user);
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

  const [results, setResults] = useState<ClassResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ClassResult | null>(null);
  const [modalMode, setModalMode] = useState<"review" | "approve" | "reject" | null>(null);
  const [principalNote, setPrincipalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  // Review panel state
  const [reviewStudents, setReviewStudents] = useState<ComputedStudent[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [principalComments, setPrincipalComments] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [savedComments, setSavedComments] = useState<Record<string, boolean>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    const yearParam = encodeURIComponent(selectedYear);
    api.get<ClassResult[]>(
      `/schools/${schoolId}/results?term=${selectedTerm}&academicYear=${yearParam}`,
    )
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId, selectedTerm, selectedYear]);

  const isArchive =
    selectedTerm !== getCurrentTerm() || selectedYear !== getCurrentAcademicYear();

  const pending = results.filter((r) => r.status === "submitted");
  const approved = results.filter((r) => r.status === "approved");
  const rejected = results.filter((r) => r.status === "rejected");
  const currentList = activeTab === "pending" ? pending : activeTab === "approved" ? approved : rejected;

  const openReview = async (result: ClassResult) => {
    setSelectedResult(result);
    setModalMode("review");
    setReviewLoading(true);
    setPrincipalComments({});
    setSavedComments({});
    setExpandedStudent(null);
    setApiError(null);
    try {
      const yearParam = encodeURIComponent(result.academicYear);
      const data = await api.get<ComputedStudent[]>(
        `/schools/${schoolId}/results/${result.classId}/computed?term=${result.term}&academicYear=${yearParam}`,
      );
      // Sort by position
      const sorted = [...data].sort((a, b) => a.position - b.position);
      setReviewStudents(sorted);
      // Pre-fill any existing principal comments
      const existing: Record<string, string> = {};
      const alreadySaved: Record<string, boolean> = {};
      sorted.forEach((s) => {
        const pc = s.comment?.principalComment ?? "";
        existing[s.student.id] = pc;
        if (pc.trim()) alreadySaved[s.student.id] = true;
      });
      setPrincipalComments(existing);
      setSavedComments(alreadySaved);
    } catch {
      setApiError("Failed to load student results");
    } finally {
      setReviewLoading(false);
    }
  };

  const openModal = (result: ClassResult, mode: "approve" | "reject") => {
    setSelectedResult(result);
    setModalMode(mode);
    setPrincipalNote("");
    setRejectionReason("");
    setApiError(null);
  };

  const closeModal = () => {
    setSelectedResult(null);
    setModalMode(null);
    setPrincipalNote("");
    setRejectionReason("");
    setReviewStudents([]);
    setPrincipalComments({});
    setSavedComments({});
    setApiError(null);
  };

  const handleSaveComment = async (result: ClassResult, studentId: string) => {
    const comment = principalComments[studentId]?.trim();
    if (!comment) return;
    setSavingComment(studentId);
    try {
      await api.post(`/schools/${schoolId}/comments`, {
        studentId,
        classId: result.classId,
        term: result.term,
        academicYear: result.academicYear,
        principalComment: comment,
      });
      setSavedComments((prev) => ({ ...prev, [studentId]: true }));
    } catch {
      setApiError("Failed to save comment. Please try again.");
    } finally {
      setSavingComment(null);
    }
  };

  const allCommentsWritten =
    reviewStudents.length > 0 &&
    reviewStudents.every((s) => savedComments[s.student.id] && principalComments[s.student.id]?.trim());

  const handleApprove = async () => {
    if (!selectedResult) return;
    setProcessing(true);
    setApiError(null);
    try {
      const updated = await api.put<ClassResult>(`/schools/${schoolId}/results/${selectedResult.id}/approve`, {
        principalNote: principalNote.trim() || undefined,
      });
      setResults((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      closeModal();
      setActiveTab("approved");
    } catch (e: any) {
      setApiError(e.message ?? "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedResult || !rejectionReason.trim()) return;
    setProcessing(true);
    setApiError(null);
    try {
      const updated = await api.put<ClassResult>(`/schools/${schoolId}/results/${selectedResult.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      setResults((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      closeModal();
      setActiveTab("rejected");
    } catch (e: any) {
      setApiError(e.message ?? "Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { key: "pending" as const, label: "Pending", count: pending.length, icon: "hourglass_empty" },
    { key: "approved" as const, label: "Approved", count: approved.length, icon: "verified" },
    { key: "rejected" as const, label: "Returned", count: rejected.length, icon: "undo" },
  ];

  const getGrade = (total: number) => {
    if (total >= 75) return { grade: "A1", color: "text-secondary" };
    if (total >= 70) return { grade: "B2", color: "text-secondary" };
    if (total >= 65) return { grade: "B3", color: "text-secondary" };
    if (total >= 60) return { grade: "C4", color: "text-primary" };
    if (total >= 55) return { grade: "C5", color: "text-primary" };
    if (total >= 50) return { grade: "C6", color: "text-primary" };
    if (total >= 45) return { grade: "D7", color: "text-on-surface-variant" };
    if (total >= 40) return { grade: "E8", color: "text-error" };
    return { grade: "F9", color: "text-error" };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32 text-on-surface-variant">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading approvals...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Result Approvals</h2>
          <p className="text-on-surface-variant text-sm mt-1">Review student results, write comments on each student, then approve or return to teacher</p>
        </div>

        <TermSelector
          term={selectedTerm}
          academicYear={selectedYear}
          onTermChange={setSelectedTerm}
          onAcademicYearChange={setSelectedYear}
        />

        {isArchive && (
          <div className="ledger-card p-4 flex items-start gap-3 border-l-4 border-tertiary-fixed-dim">
            <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontSize: 20 }}>history</span>
            <div className="text-sm">
              <p className="font-bold text-on-surface">Archived term</p>
              <p className="text-on-surface-variant mt-0.5">You're reviewing approvals from a past term for record-keeping.</p>
            </div>
          </div>
        )}

        {apiError && !modalMode && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>
        )}

        {pending.length > 0 && (
          <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-tertiary-fixed-dim">
            <span className="p-2 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg flex-shrink-0"><Icon name="notifications_active" /></span>
            <div>
              <p className="font-bold text-on-surface">{pending.length} result{pending.length > 1 ? "s" : ""} awaiting your review</p>
              <p className="text-sm text-on-surface-variant mt-0.5">Click "Review & Comment" on each result — you must comment on every student before approving</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="ledger-card overflow-hidden">
          <div className="flex border-b border-outline-variant/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === tab.key ? "text-primary border-b-2 border-primary bg-surface-container-low/50" : "text-on-surface-variant hover:bg-surface-container-low/30"}`}
              >
                <Icon name={tab.icon} className="text-base" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab.key === "pending" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : tab.key === "approved" ? "badge-validated" : "badge-error"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <Icon name="inbox" className="text-5xl text-outline/30 mb-4" />
              <p className="font-headline font-bold text-lg">No {activeTab} results</p>
              {activeTab === "pending" && <p className="text-sm mt-1">Results will appear here when teachers submit them</p>}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {currentList.map((result) => (
                <div key={result.id} className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-headline font-bold text-lg text-primary">{result.className}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${result.status === "submitted" ? "badge-pending" : result.status === "approved" ? "badge-validated" : "badge-error"}`}>
                      {result.status === "submitted" ? "Pending Review" : result.status === "approved" ? "Approved" : "Returned"}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Teacher: <span className="font-bold text-on-surface">{result.teacherName}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    {result.term.charAt(0).toUpperCase() + result.term.slice(1)} Term · {result.academicYear} · Submitted {formatTimeAgo(result.submittedAt)} ({formatDate(result.submittedAt)})
                  </p>

                  {result.rejectionReason && (
                    <div className="mt-3 p-3 bg-error-container/30 rounded-xl">
                      <p className="text-xs text-on-error-container"><span className="font-bold">Returned reason:</span> {result.rejectionReason}</p>
                    </div>
                  )}
                  {result.principalNote && (
                    <div className="mt-3 p-3 bg-secondary-container/20 rounded-xl">
                      <p className="text-xs text-on-secondary-container"><span className="font-bold">Class note:</span> "{result.principalNote}"</p>
                    </div>
                  )}

                  {result.status === "submitted" && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button
                        onClick={() => openReview(result)}
                        className="flex-1 sm:flex-none px-4 py-3 text-sm bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Icon name="rate_review" className="text-base" /> Review & Comment
                      </button>
                      <button
                        onClick={() => openModal(result, "reject")}
                        className="flex-1 sm:flex-none px-4 py-3 text-sm border border-error/30 text-error rounded-xl font-bold hover:bg-error-container/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon name="undo" className="text-base" /> Return
                      </button>
                    </div>
                  )}

                  {result.status === "approved" && (
                    <button
                      onClick={() => openReview(result)}
                      className="mt-4 px-4 py-2 text-sm border border-outline-variant/30 text-on-surface-variant rounded-xl font-medium hover:bg-surface-container-low transition-colors flex items-center gap-2"
                    >
                      <Icon name="visibility" className="text-base" /> View Results
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Review Panel (full-screen modal) ── */}
      {modalMode === "review" && selectedResult && (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col overflow-hidden">
          {/* Review header */}
          <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-outline-variant/15 bg-surface-container-low flex-shrink-0">
            <div>
              <h2 className="font-headline font-bold text-xl text-primary">{selectedResult.className} — Results Review</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {selectedResult.term.charAt(0).toUpperCase() + selectedResult.term.slice(1)} Term · {selectedResult.academicYear} · Teacher: {selectedResult.teacherName}
              </p>
            </div>
            <button onClick={closeModal} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <Icon name="close" />
            </button>
          </div>

          {/* Review body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {reviewLoading ? (
              <div className="flex items-center justify-center py-32 text-on-surface-variant">
                <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading student results...
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">

                {apiError && (
                  <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>
                )}

                {/* Class summary */}
                {reviewStudents.length > 0 && (
                  <div className="ledger-card p-5 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-headline font-black text-primary">{reviewStudents.length}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Total Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-headline font-black text-secondary">
                        {reviewStudents[0]?.classHighest.toFixed(1)}%
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Class Highest</p>
                    </div>
                    <div>
                      <p className="text-2xl font-headline font-black text-on-surface">
                        {reviewStudents[0]?.classAverage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Class Average</p>
                    </div>
                  </div>
                )}

                {/* Comment progress */}
                <div className="ledger-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Icon name={allCommentsWritten ? "check_circle" : "edit_note"} className={allCommentsWritten ? "text-secondary" : "text-on-surface-variant"} />
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {Object.values(savedComments).filter(Boolean).length} of {reviewStudents.length} comments written
                      </p>
                      <p className="text-xs text-on-surface-variant">You must comment on every student before approving</p>
                    </div>
                  </div>
                  {allCommentsWritten && selectedResult.status === "submitted" && (
                    <button
                      onClick={() => { closeModal(); openModal(selectedResult, "approve"); }}
                      className="px-4 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0"
                    >
                      <Icon name="verified" className="text-base" /> Approve Now
                    </button>
                  )}
                </div>

                {/* Student cards */}
                {reviewStudents.map((s, idx) => {
                  const isExpanded = expandedStudent === s.student.id;
                  const hasSaved = savedComments[s.student.id];
                  const commentVal = principalComments[s.student.id] ?? "";
                  const isSaving = savingComment === s.student.id;

                  return (
                    <div key={s.student.id} className={`ledger-card overflow-hidden border-l-4 ${hasSaved ? "border-secondary" : "border-outline-variant/30"}`}>
                      {/* Student header */}
                      <button
                        className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors"
                        onClick={() => setExpandedStudent(isExpanded ? null : s.student.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {s.position}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-on-surface text-sm">{s.student.lastName} {s.student.firstName}</p>
                            <p className="text-xs text-on-surface-variant">{s.student.admissionNumber} · {s.percentage.toFixed(1)}% · Pos {s.position}/{s.totalStudents}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasSaved ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-validated">Commented</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">Pending</span>
                          )}
                          <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-on-surface-variant" />
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-5 space-y-4 border-t border-outline-variant/10">
                          {/* Scores table */}
                          <div className="overflow-x-auto mt-4">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-on-surface-variant uppercase tracking-wide">
                                  <th className="text-left py-2 pr-4 font-bold">Subject</th>
                                  <th className="text-center py-2 px-2 font-bold">CA1</th>
                                  <th className="text-center py-2 px-2 font-bold">CA2</th>
                                  <th className="text-center py-2 px-2 font-bold">Exam</th>
                                  <th className="text-center py-2 px-2 font-bold">Total</th>
                                  <th className="text-center py-2 font-bold">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/10">
                                {s.scores.map((score, si) => {
                                  const { grade, color } = getGrade(score.total);
                                  return (
                                    <tr key={si}>
                                      <td className="py-2 pr-4 font-medium text-on-surface">{(score as any).subjectName ?? "Subject"}</td>
                                      <td className="text-center py-2 px-2 text-on-surface-variant">{score.ca1}</td>
                                      <td className="text-center py-2 px-2 text-on-surface-variant">{score.ca2}</td>
                                      <td className="text-center py-2 px-2 text-on-surface-variant">{score.exam}</td>
                                      <td className="text-center py-2 px-2 font-bold text-on-surface">{score.total}</td>
                                      <td className={`text-center py-2 font-bold ${color}`}>{grade}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-outline-variant/20">
                                  <td className="py-2 font-bold text-on-surface" colSpan={4}>Total</td>
                                  <td className="text-center py-2 font-black text-primary">{s.totalScore}</td>
                                  <td className="text-center py-2 font-black text-primary">{s.percentage.toFixed(1)}%</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Teacher comment */}
                          {s.comment?.teacherComment && (
                            <div className="p-3 bg-surface-container-highest/50 rounded-xl">
                              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Teacher's Comment</p>
                              <p className="text-sm text-on-surface italic">"{s.comment.teacherComment}"</p>
                            </div>
                          )}

                          {/* Principal comment */}
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                              Your Comment <span className="text-error">*</span>
                            </label>
                            <textarea
                              value={commentVal}
                              onChange={(e) => {
                                setPrincipalComments((prev) => ({ ...prev, [s.student.id]: e.target.value }));
                                // If the text changed, mark as unsaved
                                if (savedComments[s.student.id]) {
                                  setSavedComments((prev) => ({ ...prev, [s.student.id]: false }));
                                }
                              }}
                              rows={3}
                              placeholder="Write your comment for this student's result sheet..."
                              className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
                            />
                            {/* Quick comments */}
                            <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                              {QUICK_PRINCIPAL_COMMENTS.map((qc, qi) => (
                                <button
                                  key={qi}
                                  onClick={() => {
                                    setPrincipalComments((prev) => ({ ...prev, [s.student.id]: qc }));
                                    setSavedComments((prev) => ({ ...prev, [s.student.id]: false }));
                                  }}
                                  className="text-[10px] px-2.5 py-1.5 rounded-full border border-outline-variant/30 hover:border-primary/40 text-on-surface-variant hover:text-primary transition-colors"
                                >
                                  {qc.split(".")[0]}…
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => handleSaveComment(selectedResult, s.student.id)}
                              disabled={!commentVal.trim() || isSaving || hasSaved}
                              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                            >
                              {isSaving ? (
                                <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                              ) : hasSaved ? (
                                <><Icon name="check_circle" className="text-base" /> Saved</>
                              ) : (
                                <><Icon name="save" className="text-base" /> Save Comment</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Bottom approve bar */}
                {selectedResult.status === "submitted" && (
                  <div className={`ledger-card p-5 flex items-center justify-between gap-4 ${allCommentsWritten ? "border border-secondary/30" : "opacity-70"}`}>
                    <div>
                      <p className={`font-bold text-sm ${allCommentsWritten ? "text-secondary" : "text-on-surface-variant"}`}>
                        {allCommentsWritten ? "All comments written — ready to approve!" : `Write comments for all ${reviewStudents.length} students to unlock approval`}
                      </p>
                    </div>
                    <button
                      disabled={!allCommentsWritten}
                      onClick={() => { closeModal(); openModal(selectedResult, "approve"); }}
                      className="px-5 py-3 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2 flex-shrink-0"
                    >
                      <Icon name="verified" /> Approve Results
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {modalMode === "approve" && selectedResult && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient w-full max-w-lg animate-scale-in">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="font-headline font-bold text-xl text-primary">Approve — {selectedResult.className}</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">{selectedResult.term} Term · {selectedResult.academicYear}</p>
            </div>
            <div className="p-6 space-y-4">
              {apiError && <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>}
              <p className="text-sm text-on-surface-variant">Approving will unlock these results for download. You may add a class-level note that appears on the result sheet header.</p>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Class Note <span className="normal-case font-normal">(optional — appears on all sheets)</span></label>
                <textarea
                  value={principalNote}
                  onChange={(e) => setPrincipalNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Congratulations to all students..."
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-ghost flex-1 text-sm">Cancel</button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 py-3 text-sm bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {processing ? <><span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" /> Approving...</> : <><Icon name="verified" /> Approve Results</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modalMode === "reject" && selectedResult && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient w-full max-w-lg animate-scale-in">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="font-headline font-bold text-xl text-primary">Return Results — {selectedResult.className}</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">The teacher will be notified to make corrections</p>
            </div>
            <div className="p-6 space-y-4">
              {apiError && <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>}
              <p className="text-sm text-on-surface-variant">Returning will send the results back to the teacher for revision. Please explain clearly what needs to be corrected.</p>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Reason for Returning <span className="text-error">*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. Some scores appear incorrect. Please review Mathematics scores..."
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-error/30 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-ghost flex-1 text-sm">Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 py-3 text-sm bg-error text-on-error rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {processing ? <><span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" /> Returning...</> : <><Icon name="undo" /> Return to Teacher</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};