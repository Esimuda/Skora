import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

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
  "Well done to all students. Continue to strive for greater heights.",
  "Commendable performance. Maintain this standard next term.",
  "Good effort shown this term. We expect even better results next term.",
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

export const ApprovalsPage = () => {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? "";

  const [results, setResults] = useState<ClassResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ClassResult | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [principalNote, setPrincipalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    api.get<ClassResult[]>(`/schools/${schoolId}/results`)
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId]);

  const pending = results.filter((r) => r.status === "submitted");
  const approved = results.filter((r) => r.status === "approved");
  const rejected = results.filter((r) => r.status === "rejected");
  const currentList = activeTab === "pending" ? pending : activeTab === "approved" ? approved : rejected;

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
    setApiError(null);
  };

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
          <p className="text-on-surface-variant text-sm mt-1">Review submitted results, add your comment, then approve or return to teacher</p>
        </div>

        {apiError && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>
        )}

        {/* Pending alert */}
        {pending.length > 0 && (
          <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-tertiary-fixed-dim">
            <span className="p-2 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg flex-shrink-0"><Icon name="notifications_active" /></span>
            <div>
              <p className="font-bold text-on-surface">{pending.length} result{pending.length > 1 ? "s" : ""} awaiting your approval</p>
              <p className="text-sm text-on-surface-variant mt-0.5">Teachers cannot download results until you approve them</p>
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

          {/* List */}
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
                      <p className="text-xs text-on-secondary-container"><span className="font-bold">Your comment:</span> "{result.principalNote}"</p>
                    </div>
                  )}

                  {result.status === "submitted" && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openModal(result, "approve")}
                        className="flex-1 sm:flex-none px-4 py-3 text-sm bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Icon name="check" className="text-base" /> Approve
                      </button>
                      <button
                        onClick={() => openModal(result, "reject")}
                        className="flex-1 sm:flex-none px-4 py-3 text-sm border border-error/30 text-error rounded-xl font-bold hover:bg-error-container/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon name="undo" className="text-base" /> Return
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
                <p className="text-sm text-on-surface-variant">Approving will unlock these results for download. You may add a comment that appears on every student's result sheet.</p>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Principal's Comment <span className="normal-case font-normal">(optional)</span></label>
                  <textarea
                    value={principalNote}
                    onChange={(e) => setPrincipalNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Keep up the excellent work..."
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  {QUICK_PRINCIPAL_COMMENTS.map((qc, i) => (
                    <button
                      key={i}
                      onClick={() => setPrincipalNote(qc)}
                      className={`w-full text-left text-xs p-3 rounded-xl border-2 transition-colors ${principalNote === qc ? "border-secondary bg-secondary-container/20 text-on-secondary-container font-medium" : "border-outline-variant/20 hover:border-secondary/30 text-on-surface-variant"}`}
                    >
                      "{qc}"
                    </button>
                  ))}
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
      </div>
    </DashboardLayout>
  );
};
