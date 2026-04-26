import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDataStore, ClassResultStatus } from "@/store/dataStore";
import { Term } from "@/types";

const CURRENT_TERM: Term = "first";
const CURRENT_YEAR = "2024/2025";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
};

const Icon = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

const QUICK_PRINCIPAL_COMMENTS = [
  "Keep up the excellent work. The school is proud of your achievements.",
  "Well done to all students. Continue to strive for greater heights.",
  "Commendable performance. Maintain this standard next term.",
  "Good effort shown this term. We expect even better results next term.",
];

export const ApprovalsPage = () => {
  const { resultStatuses, approveResults, rejectResults, computeClassResults } =
    useDataStore();

  const [selectedStatus, setSelectedStatus] =
    useState<ClassResultStatus | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
  const [principalComment, setPrincipalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  const termStatuses = resultStatuses.filter(
    (r) => r.term === CURRENT_TERM && r.academicYear === CURRENT_YEAR,
  );
  const pending = termStatuses.filter((r) => r.status === "submitted");
  const approved = termStatuses.filter((r) => r.status === "approved");
  const rejected = termStatuses.filter((r) => r.status === "rejected");
  const currentList =
    activeTab === "pending"
      ? pending
      : activeTab === "approved"
        ? approved
        : rejected;

  const openModal = (status: ClassResultStatus, mode: "approve" | "reject") => {
    setSelectedStatus(status);
    setModalMode(mode);
    setPrincipalComment("");
    setRejectionReason("");
  };
  const closeModal = () => {
    setSelectedStatus(null);
    setModalMode(null);
    setPrincipalComment("");
    setRejectionReason("");
  };

  const handleApprove = () => {
    if (!selectedStatus) return;
    setProcessing(true);
    setTimeout(() => {
      approveResults(
        selectedStatus.classId,
        selectedStatus.term,
        selectedStatus.academicYear,
        principalComment.trim() || undefined,
      );
      setProcessing(false);
      closeModal();
      setActiveTab("approved");
    }, 800);
  };

  const handleReject = () => {
    if (!selectedStatus || !rejectionReason.trim()) return;
    setProcessing(true);
    setTimeout(() => {
      rejectResults(
        selectedStatus.classId,
        selectedStatus.term,
        selectedStatus.academicYear,
        rejectionReason.trim(),
      );
      setProcessing(false);
      closeModal();
      setActiveTab("rejected");
    }, 800);
  };

  const getClassStats = (status: ClassResultStatus) => {
    const results = computeClassResults(
      status.classId,
      status.term,
      status.academicYear,
    );
    if (results.length === 0) return null;
    const highest = Math.max(...results.map((r) => r.percentage));
    const average =
      results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
    return { count: results.length, highest, average };
  };

  const tabs = [
    {
      key: "pending" as const,
      label: "Pending",
      count: pending.length,
      icon: "hourglass_empty",
    },
    {
      key: "approved" as const,
      label: "Approved",
      count: approved.length,
      icon: "verified",
    },
    {
      key: "rejected" as const,
      label: "Returned",
      count: rejected.length,
      icon: "undo",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
            Result Approvals
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Review submitted results, add your comment, then approve or return
            to teacher
          </p>
        </div>

        {/* Pending alert */}
        {pending.length > 0 && (
          <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-tertiary-fixed-dim">
            <span className="p-2 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg flex-shrink-0">
              <Icon name="notifications_active" />
            </span>
            <div>
              <p className="font-bold text-on-surface">
                {pending.length} result{pending.length > 1 ? "s" : ""} awaiting
                your approval
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Teachers cannot download results until you approve them
              </p>
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
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                  activeTab === tab.key
                    ? "text-primary border-b-2 border-primary bg-surface-container-low/50"
                    : "text-on-surface-variant hover:bg-surface-container-low/30"
                }`}
              >
                <Icon name={tab.icon} className="text-base" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tab.key === "pending"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                        : tab.key === "approved"
                          ? "badge-validated"
                          : "badge-error"
                    }`}
                  >
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
              <p className="font-headline font-bold text-lg">
                No {activeTab} results
              </p>
              {activeTab === "pending" && (
                <p className="text-sm mt-1">
                  Results will appear here when teachers submit them
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {currentList.map((status) => {
                const stats = getClassStats(status);
                return (
                  <div key={`${status.classId}-${status.term}`} className="p-4 md:p-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-headline font-bold text-lg text-primary">
                          {status.className}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            status.status === "submitted"
                              ? "badge-pending"
                              : status.status === "approved"
                                ? "badge-validated"
                                : "badge-error"
                          }`}
                        >
                          {status.status === "submitted" ? "Pending Review" : status.status === "approved" ? "Approved" : "Returned"}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        Teacher: <span className="font-bold text-on-surface">{status.teacherName}</span> · {status.studentCount} students
                      </p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">
                        First Term · {status.academicYear} · Submitted {formatTimeAgo(status.submittedAt)} ({formatDate(status.submittedAt)})
                      </p>

                      {stats && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <span className="text-xs px-2.5 py-1 bg-surface-container-low rounded-lg font-medium text-on-surface-variant">{stats.count} students</span>
                          <span className="text-xs px-2.5 py-1 bg-secondary-container/30 text-on-secondary-container rounded-lg font-medium">Highest: {stats.highest.toFixed(1)}%</span>
                          <span className="text-xs px-2.5 py-1 bg-primary/5 text-primary rounded-lg font-medium">Average: {stats.average.toFixed(1)}%</span>
                        </div>
                      )}

                      {status.rejectionReason && (
                        <div className="mt-3 p-3 bg-error-container/30 rounded-xl">
                          <p className="text-xs text-on-error-container">
                            <span className="font-bold">Returned reason:</span> {status.rejectionReason}
                          </p>
                        </div>
                      )}
                      {status.principalComment && (
                        <div className="mt-3 p-3 bg-secondary-container/20 rounded-xl">
                          <p className="text-xs text-on-secondary-container">
                            <span className="font-bold">Your comment:</span> "{status.principalComment}"
                          </p>
                        </div>
                      )}

                      {status.status === "submitted" && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => openModal(status, "approve")}
                            className="flex-1 sm:flex-none px-4 py-3 text-sm bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          >
                            <Icon name="check" className="text-base" /> Approve
                          </button>
                          <button
                            onClick={() => openModal(status, "reject")}
                            className="flex-1 sm:flex-none px-4 py-3 text-sm border border-error/30 text-error rounded-xl font-bold hover:bg-error-container/20 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icon name="undo" className="text-base" /> Return
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Approve Modal */}
        {modalMode === "approve" && selectedStatus && (
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient w-full max-w-lg animate-scale-in">
              <div className="p-6 border-b border-outline-variant/10">
                <h3 className="font-headline font-bold text-xl text-primary">
                  Approve — {selectedStatus.className}
                </h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  First Term · {selectedStatus.academicYear}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Approving will unlock these results for download. You may add
                  a comment that appears on every student's result sheet.
                </p>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Principal's Comment{" "}
                    <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={principalComment}
                    onChange={(e) => setPrincipalComment(e.target.value)}
                    rows={3}
                    placeholder="e.g. Keep up the excellent work..."
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  {QUICK_PRINCIPAL_COMMENTS.map((qc, i) => (
                    <button
                      key={i}
                      onClick={() => setPrincipalComment(qc)}
                      className={`w-full text-left text-xs p-3 rounded-xl border-2 transition-colors ${
                        principalComment === qc
                          ? "border-secondary bg-secondary-container/20 text-on-secondary-container font-medium"
                          : "border-outline-variant/20 hover:border-secondary/30 text-on-surface-variant"
                      }`}
                    >
                      "{qc}"
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="btn-ghost flex-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 py-3 text-sm bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />{" "}
                        Approving...
                      </>
                    ) : (
                      <>
                        <Icon name="verified" /> Approve Results
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {modalMode === "reject" && selectedStatus && (
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient w-full max-w-lg animate-scale-in">
              <div className="p-6 border-b border-outline-variant/10">
                <h3 className="font-headline font-bold text-xl text-primary">
                  Return Results — {selectedStatus.className}
                </h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  The teacher will be notified to make corrections
                </p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Returning will send the results back to the teacher for
                  revision. Please explain clearly what needs to be corrected.
                </p>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Reason for Returning <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="e.g. Some scores appear incorrect. Please review Mathematics scores..."
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-error/30 transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="btn-ghost flex-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 py-3 text-sm bg-error text-on-error rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />{" "}
                        Returning...
                      </>
                    ) : (
                      <>
                        <Icon name="undo" /> Return to Teacher
                      </>
                    )}
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
