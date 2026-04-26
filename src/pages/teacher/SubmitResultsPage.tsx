import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { Term } from '@/types';

const CURRENT_TERM: Term = 'first';
const CURRENT_YEAR = '2024/2025';

const formatPosition = (pos: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = pos % 100;
  return pos + (s[(v - 20) % 10] || s[v] || s[0]);
};

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SubmitResultsPage = () => {
  const user = useAuthStore((s) => s.user);
  const {
    classes, getStudentsByClass, getSubjectsByClass,
    getScores, getPsychometric, getComment,
    getResultStatus, submitResults, computeClassResults,
  } = useDataStore();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const students = getStudentsByClass(selectedClassId);
  const subjects = getSubjectsByClass(selectedClassId);
  const resultStatus = selectedClassId
    ? getResultStatus(selectedClassId, CURRENT_TERM, CURRENT_YEAR)
    : undefined;

  const studentsWithFullScores = students.filter((student) =>
    subjects.every((sub) => {
      const scores = getScores(selectedClassId, sub.id, CURRENT_TERM, CURRENT_YEAR);
      return scores.some((sc) => sc.studentId === student.id);
    })
  );
  const studentsWithPsychometric = students.filter((student) => {
    const entry = getPsychometric(student.id, selectedClassId, CURRENT_TERM, CURRENT_YEAR);
    return entry && Object.keys(entry.ratings).length >= 8;
  });
  const studentsWithComments = students.filter((student) => {
    const c = getComment(student.id, selectedClassId, CURRENT_TERM, CURRENT_YEAR);
    return c?.teacherComment?.trim();
  });

  const totalStudents = students.length;
  const hasStudents = totalStudents > 0;
  const hasSubjects = subjects.length > 0;
  const scoresComplete = hasStudents && studentsWithFullScores.length === totalStudents;
  const psychometricComplete = hasStudents && studentsWithPsychometric.length === totalStudents;
  const commentsComplete = hasStudents && studentsWithComments.length === totalStudents;
  const allComplete = hasStudents && hasSubjects && scoresComplete && psychometricComplete && commentsComplete;

  const classResults = selectedClassId
    ? computeClassResults(selectedClassId, CURRENT_TERM, CURRENT_YEAR)
    : [];

  const checklist = [
    { id: 'students',     label: 'Students Added',          done: hasStudents,         count: totalStudents,                    total: totalStudents, icon: 'group' },
    { id: 'subjects',     label: 'Subjects Added',           done: hasSubjects,         count: subjects.length,                  total: subjects.length, icon: 'book' },
    { id: 'scores',       label: 'Academic Scores',          done: scoresComplete,      count: studentsWithFullScores.length,    total: totalStudents, icon: 'edit_note' },
    { id: 'psychometric', label: 'Psychometric Assessment',  done: psychometricComplete,count: studentsWithPsychometric.length,  total: totalStudents, icon: 'psychology' },
    { id: 'comments',     label: 'Teacher Comments',         done: commentsComplete,    count: studentsWithComments.length,      total: totalStudents, icon: 'chat' },
  ];

  const completedCount = checklist.filter((i) => i.done).length;
  const readinessPct = Math.round((completedCount / checklist.length) * 100);

  const handleSubmit = () => {
    if (!selectedClass || !allComplete) return;
    setSubmitting(true);
    const teacherName = user ? `${user.firstName} ${user.lastName}` : 'Class Teacher';
    setTimeout(() => {
      submitResults(selectedClassId, selectedClass.name, teacherName, CURRENT_TERM, CURRENT_YEAR);
      setSubmitting(false);
    }, 1200);
  };

  const isSubmitted = resultStatus?.status === 'submitted' || resultStatus?.status === 'approved';
  const isApproved = resultStatus?.status === 'approved';
  const isRejected = resultStatus?.status === 'rejected';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
            Submit Results
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Review completeness, then notify the principal to review and approve
          </p>
        </div>

        {/* Class selector */}
        <div className="ledger-card p-5">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Select Class to Submit
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="input-inset"
          >
            <option value="">— Choose a class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {!selectedClassId ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="send" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to check and submit</p>
          </div>
        ) : (
          <>
            {/* Status banners */}
            {isApproved && (
              <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-secondary">
                <span className="p-2 bg-secondary-container/40 text-on-secondary-container rounded-lg flex-shrink-0">
                  <Icon name="verified" />
                </span>
                <div>
                  <p className="font-bold text-on-surface">Results Approved!</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {selectedClass?.name} results have been approved by the principal and are available for download.
                  </p>
                  {resultStatus?.principalComment && (
                    <p className="text-sm text-on-surface mt-1 italic">
                      Principal's note: "{resultStatus.principalComment}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {isRejected && (
              <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-error">
                <span className="p-2 bg-error-container text-on-error-container rounded-lg flex-shrink-0">
                  <Icon name="undo" />
                </span>
                <div>
                  <p className="font-bold text-on-surface">Results Returned for Revision</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">Please make corrections and resubmit.</p>
                  {resultStatus?.rejectionReason && (
                    <p className="text-sm text-error mt-1">Reason: "{resultStatus.rejectionReason}"</p>
                  )}
                </div>
              </div>
            )}

            {isSubmitted && !isApproved && !isRejected && (
              <div className="ledger-card p-5 flex items-start gap-4 border-l-4 border-tertiary-fixed-dim">
                <span className="p-2 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg flex-shrink-0">
                  <Icon name="hourglass_empty" />
                </span>
                <div>
                  <p className="font-bold text-on-surface">Awaiting Principal Approval</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    Your results have been submitted. The principal has been notified and will review them shortly.
                  </p>
                </div>
              </div>
            )}

            {/* Class summary */}
            <div className="ledger-card p-5 flex items-center justify-between">
              <div>
                <p className="font-headline font-bold text-lg text-primary">{selectedClass?.name}</p>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  First Term · {CURRENT_YEAR} · {totalStudents} students · {subjects.length} subjects
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                isApproved ? 'badge-validated'
                : isRejected ? 'badge-error'
                : isSubmitted ? 'badge-pending'
                : 'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {isApproved ? 'Approved' : isRejected ? 'Returned' : isSubmitted ? 'Submitted' : 'Draft'}
              </span>
            </div>

            {/* Checklist */}
            <div className="ledger-card overflow-hidden">
              <div className="px-6 py-5 border-b border-outline-variant/10">
                <h3 className="font-headline font-bold text-lg text-primary">Pre-submission Checklist</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">All items must be complete before submitting</p>
              </div>

              <div className="divide-y divide-outline-variant/10">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <span className={`p-2 rounded-lg flex-shrink-0 ${
                      item.done
                        ? 'bg-secondary-container/40 text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}>
                      <Icon name={item.done ? 'check' : 'close'} className="text-base" />
                    </span>
                    <Icon name={item.icon} className="text-on-surface-variant flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-on-surface text-sm">{item.label}</p>
                    </div>
                    {item.total > 0 && item.id !== 'students' && item.id !== 'subjects' && (
                      <span className={`text-sm font-bold ${item.done ? 'text-secondary' : 'text-error'}`}>
                        {item.count}/{item.total}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall readiness */}
              <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    Overall Readiness
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {completedCount}/{checklist.length} complete
                  </span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${allComplete ? 'bg-secondary' : 'bg-primary'}`}
                    style={{ width: `${readinessPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Position preview */}
            {classResults.length > 0 && (
              <div className="ledger-card overflow-hidden">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-headline font-bold text-lg text-primary">Class Position Preview</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Based on scores entered so far</p>
                  </div>
                  <Icon name={showPreview ? 'expand_less' : 'expand_more'} className="text-on-surface-variant" />
                </button>

                {showPreview && (
                  <div className="border-t border-outline-variant/10 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="text-left px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Pos.</th>
                          <th className="text-left px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Student</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Score</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">%</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Scores</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Psych</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Comment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {classResults.map((result) => {
                          const hasScores = studentsWithFullScores.some((s) => s.id === result.student.id);
                          const hasPsych = studentsWithPsychometric.some((s) => s.id === result.student.id);
                          const hasComment = studentsWithComments.some((s) => s.id === result.student.id);
                          return (
                            <tr key={result.student.id} className="hover:bg-surface-container-low/40 transition-colors">
                              <td className="px-6 py-3 font-bold text-primary">{formatPosition(result.position)}</td>
                              <td className="px-6 py-3">
                                <p className="font-bold text-on-surface">{result.student.lastName} {result.student.firstName}</p>
                                <p className="text-xs text-on-surface-variant">{result.student.admissionNumber}</p>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-on-surface">{result.totalScore}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-bold text-sm ${
                                  result.percentage >= 75 ? 'text-secondary'
                                  : result.percentage >= 50 ? 'text-primary'
                                  : result.percentage >= 40 ? 'text-on-tertiary-container'
                                  : 'text-error'
                                }`}>
                                  {result.percentage.toFixed(1)}%
                                </span>
                              </td>
                              {[hasScores, hasPsych, hasComment].map((has, i) => (
                                <td key={i} className="px-4 py-3 text-center">
                                  <Icon
                                    name={has ? 'check_circle' : 'cancel'}
                                    className={`text-base ${has ? 'text-secondary' : 'text-error'}`}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Submit / Resubmit */}
            {(!isSubmitted || isRejected) && (
              <div className="ledger-card p-6">
                <h3 className="font-headline font-bold text-lg text-primary mb-1">
                  {isRejected ? 'Resubmit After Revision' : 'Ready to Submit?'}
                </h3>
                <p className="text-sm text-on-surface-variant mb-5">
                  {isRejected
                    ? 'Make the required corrections then resubmit for approval.'
                    : 'Once submitted, the principal will be notified to review and approve. Results can only be downloaded after approval.'}
                </p>

                {!allComplete && (
                  <div className="flex items-center gap-3 p-4 bg-tertiary-fixed/30 rounded-xl mb-5">
                    <Icon name="warning" className="text-on-tertiary-container flex-shrink-0" />
                    <p className="text-sm text-on-surface">
                      Complete all checklist items above before submitting.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!allComplete || submitting}
                  className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Submitting & Notifying Principal...</>
                  ) : allComplete ? (
                    <><Icon name="send" /> {isRejected ? 'Resubmit Results' : 'Submit Results & Notify Principal'}</>
                  ) : (
                    <><Icon name="lock" /> Complete Checklist First</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};