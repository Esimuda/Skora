import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useTeacherClasses } from '@/lib/useTeacherClasses';
import { Term } from '@/types';
import { getCurrentTerm, getCurrentAcademicYear } from '@/components/ui/TermSelector';

const QUICK_COMMENTS = [
  'An excellent student who consistently performs above expectations. Keep it up!',
  'A hardworking and dedicated student. Continue to put in your best effort.',
  'Shows great potential. With more focus, performance will greatly improve.',
  'Good performance this term. Strive for greater heights next term.',
  'Satisfactory effort shown. Needs to improve study habits for better results.',
  'A well-behaved student. Focus more on academics to achieve better scores.',
  'Brilliant performance! Your dedication to learning is commendable.',
  'You have shown remarkable improvement this term. Keep up the good work.',
];

const formatPosition = (pos: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = pos % 100;
  return pos + (s[(v - 20) % 10] || s[v] || s[0]);
};

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ComputedResult {
  student: { id: string; firstName: string; lastName: string; middleName?: string; admissionNumber: string };
  position: number;
  percentage: number;
  totalScore: number;
  totalPossible: number;
  totalStudents: number;
}

interface Comment {
  id?: string;
  studentId: string;
  classId: string;
  term: string;
  academicYear: string;
  teacherComment?: string;
  principalComment?: string;
}

export const CommentsPage = () => {
  const { classes, loading: loadingClasses, noClasses, schoolId } = useTeacherClasses();

  const [classResults, setClassResults] = useState<ComputedResult[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState<Term>(() => getCurrentTerm());
  const [academicYear, setAcademicYear] = useState<string>(() => getCurrentAcademicYear());
  const [commentText, setCommentText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());
  const [loadingResults, setLoadingResults] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Mobile: toggles between student list and comment panel
  const [mobileView, setMobileView] = useState<'list' | 'comment'>('list');

  useEffect(() => {
    if (!selectedClassId || !schoolId) {
      setClassResults([]); setComments([]); setSelectedStudentId(''); setSavedStudents(new Set()); return;
    }
    setLoadingResults(true); setApiError(null);
    Promise.all([
      api.get<any>(`/schools/${schoolId}/results/${selectedClassId}/computed?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
      api.get<Comment[]>(`/schools/${schoolId}/comments/by-class/${selectedClassId}?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
    ]).then(([resultsResponse, cmts]) => {
      const results: ComputedResult[] = Array.isArray(resultsResponse) ? resultsResponse : (resultsResponse?.data ?? []);
      setClassResults(results);
      setComments(cmts);
      setSavedStudents(new Set(cmts.filter((c) => c.teacherComment?.trim()).map((c) => c.studentId)));
      setSelectedStudentId('');
      setCommentText('');
      setMobileView('list');
    }).catch((e) => setApiError(e.message ?? 'Failed to load data'))
      .finally(() => setLoadingResults(false));
  }, [selectedClassId, term, academicYear, schoolId]);

  useEffect(() => {
    if (!selectedStudentId) { setCommentText(''); return; }
    const existing = comments.find((c) => c.studentId === selectedStudentId);
    setCommentText(existing?.teacherComment ?? '');
    setSaveStatus('idle');
  }, [selectedStudentId]);

  const selectedResult = classResults.find((r) => r.student.id === selectedStudentId);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setMobileView('comment');
  };

  const handleSave = async () => {
    if (!selectedStudentId || !selectedClassId) return;
    setSaveStatus('saving'); setApiError(null);
    const existing = comments.find((c) => c.studentId === selectedStudentId);
    try {
      const saved = await api.post<Comment>(`/schools/${schoolId}/comments`, {
        studentId: selectedStudentId, classId: selectedClassId, term, academicYear,
        teacherComment: commentText.trim(), principalComment: existing?.principalComment,
      });
      setComments((prev) => {
        const idx = prev.findIndex((c) => c.studentId === selectedStudentId);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      setSaveStatus('saved');
      if (commentText.trim()) setSavedStudents((prev) => new Set([...prev, selectedStudentId]));
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save comment'); setSaveStatus('idle');
    }
  };

  const handleNextStudent = () => {
    const idx = classResults.findIndex((r) => r.student.id === selectedStudentId);
    if (idx < classResults.length - 1) {
      setSelectedStudentId(classResults[idx + 1].student.id);
      setSaveStatus('idle');
    }
  };

  const getSuggestedComment = (result: ComputedResult) => {
    const { position, percentage } = result;
    if (position === 1) return QUICK_COMMENTS[0];
    if (percentage >= 75) return QUICK_COMMENTS[6];
    if (percentage >= 65) return QUICK_COMMENTS[1];
    if (percentage >= 55) return QUICK_COMMENTS[3];
    if (percentage >= 45) return QUICK_COMMENTS[4];
    return QUICK_COMMENTS[5];
  };

  const isLastStudent = classResults.findIndex((r) => r.student.id === selectedStudentId) === classResults.length - 1;

  return (
    <DashboardLayout>
      {noClasses && (
        <div className="rounded-xl bg-error-container text-on-error-container px-5 py-4 flex items-start gap-3">
          <Icon name="warning" className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">No Classes Assigned</p>
            <p className="text-sm mt-0.5">You have not been assigned to any class yet. Contact your principal.</p>
          </div>
        </div>
      )}

      {!noClasses && (
        <div className="space-y-4 animate-fade-in">

          {/* Header */}
          <div>
            <h2 className="font-headline font-extrabold text-xl md:text-3xl text-primary tracking-tight">Teacher Comments</h2>
            <p className="text-on-surface-variant text-xs md:text-sm mt-0.5">Write a comment for each student — appears on their result sheet</p>
          </div>

          {apiError && (
            <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
              <Icon name="error" className="text-base flex-shrink-0 mt-0.5" /><span>{apiError}</span>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="ledger-card p-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Class</label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 text-on-surface-variant text-sm"><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Loading...</div>
              ) : (
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="input-inset text-base">
                  <option value="">— Choose class —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="ledger-card p-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Term</label>
              <select value={term} onChange={(e) => setTerm(e.target.value as Term)} className="input-inset text-base">
                <option value="first">First Term</option>
                <option value="second">Second Term</option>
                <option value="third">Third Term</option>
              </select>
            </div>
            <div className="ledger-card p-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Academic Year</label>
              <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2024/2025" className="input-inset text-base" />
            </div>
          </div>

          {!selectedClassId ? (
            <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Icon name="chat" className="text-5xl text-outline/30 mb-4" />
              <p className="font-headline font-bold text-base">Select a class to begin</p>
            </div>
          ) : loadingResults ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading...
            </div>
          ) : classResults.length === 0 ? (
            <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Icon name="edit_note" className="text-5xl text-outline/30 mb-4" />
              <p className="font-headline font-bold text-base">No results found for this term</p>
              <p className="text-sm mt-1">Enter and save scores first</p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="ledger-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-on-surface">Progress</span>
                  <span className="text-sm text-on-surface-variant">{savedStudents.size}/{classResults.length} commented</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${(savedStudents.size / classResults.length) * 100}%` }} />
                </div>
              </div>

              {/* ── MOBILE: tab switcher between list and comment panel ── */}
              <div className="flex lg:hidden items-center bg-surface-container rounded-xl p-1 gap-1">
                <button onClick={() => setMobileView('list')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${mobileView === 'list' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}>
                  <Icon name="group" className="text-base" /> Students ({classResults.length})
                </button>
                <button onClick={() => setMobileView('comment')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${mobileView === 'comment' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}>
                  <Icon name="chat" className="text-base" />
                  {selectedResult ? `${selectedResult.student.lastName} ${selectedResult.student.firstName}`.slice(0, 14) + '…' : 'Comment'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

                {/* Student list */}
                <div className={`ledger-card overflow-hidden ${mobileView === 'comment' ? 'hidden lg:block' : 'block'}`}>
                  <div className="px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low">
                    <h3 className="font-headline font-bold text-sm text-primary">Students by Position</h3>
                  </div>
                  <div className="divide-y divide-outline-variant/10 overflow-y-auto max-h-[60vh] lg:max-h-[580px]">
                    {classResults.map((result) => {
                      const isSelected = selectedStudentId === result.student.id;
                      const isSaved = savedStudents.has(result.student.id);
                      return (
                        <button key={result.student.id} onClick={() => handleSelectStudent(result.student.id)}
                          className={`w-full text-left px-4 py-3.5 transition-colors border-l-4 ${isSelected ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-surface-container-low/50'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary flex-shrink-0">{formatPosition(result.position)}</span>
                                <p className="text-sm font-bold text-on-surface truncate">{result.student.lastName} {result.student.firstName}</p>
                              </div>
                              <p className="text-xs text-on-surface-variant mt-0.5">{result.percentage.toFixed(1)}% · {result.student.admissionNumber}</p>
                            </div>
                            {isSaved
                              ? <Icon name="check_circle" className="text-secondary text-lg flex-shrink-0" />
                              : <Icon name="arrow_forward_ios" className="text-outline/40 text-sm flex-shrink-0" />
                            }
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment panel */}
                <div className={`ledger-card overflow-hidden ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
                  {!selectedResult ? (
                    <div className="flex flex-col items-center justify-center h-72 text-on-surface-variant">
                      <Icon name="draw" className="text-5xl text-outline/30 mb-4" />
                      <p className="font-headline font-bold text-base text-center px-4">Select a student to write their comment</p>
                    </div>
                  ) : (
                    <>
                      {/* Student header */}
                      <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-headline font-bold text-base md:text-lg text-primary truncate">
                              {selectedResult.student.lastName} {selectedResult.student.firstName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary">{formatPosition(selectedResult.position)}</span>
                              <span className="text-xs text-on-surface-variant">{selectedResult.percentage.toFixed(1)}%</span>
                              <span className="text-xs text-on-surface-variant">{selectedResult.totalScore}/{selectedResult.totalPossible}</span>
                            </div>
                          </div>
                          <button onClick={handleSave} disabled={saveStatus === 'saving'}
                            className={`btn-primary text-sm flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60 ${saveStatus === 'saved' ? 'bg-secondary' : ''}`}>
                            <Icon name={saveStatus === 'saved' ? 'check' : 'save'} className="text-base" />
                            <span className="hidden sm:inline">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Suggested comment */}
                        <div className="p-3 bg-surface-container-low rounded-xl">
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Suggested</p>
                          <p className="text-sm text-on-surface italic mb-2">"{getSuggestedComment(selectedResult)}"</p>
                          <button onClick={() => { setCommentText(getSuggestedComment(selectedResult)); setSaveStatus('idle'); }}
                            className="text-xs text-primary font-bold hover:underline">Use this</button>
                        </div>

                        {/* Text area */}
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Teacher's Comment</label>
                          <textarea value={commentText}
                            onChange={(e) => { setCommentText(e.target.value); setSaveStatus('idle'); }}
                            rows={4}
                            placeholder="Write your comment for this student..."
                            className="w-full bg-surface-container-highest border-2 border-transparent rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary transition-all resize-none"
                          />
                          <p className="text-xs text-on-surface-variant mt-1">{commentText.length} characters</p>
                        </div>

                        {/* Quick comments */}
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Quick Comments</p>
                          <div className="space-y-1.5">
                            {QUICK_COMMENTS.map((qc, i) => (
                              <button key={i} onClick={() => { setCommentText(qc); setSaveStatus('idle'); }}
                                className={`w-full text-left text-xs p-3 rounded-xl border-2 transition-colors ${commentText === qc ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-outline-variant/20 hover:border-primary/30 text-on-surface-variant'}`}>
                                "{qc}"
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                          <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2 flex-1 justify-center">
                            <Icon name="save" /> Save
                          </button>
                          <button onClick={() => { handleSave(); setTimeout(handleNextStudent, 500); }}
                            disabled={isLastStudent}
                            className="btn-ghost text-sm disabled:opacity-40 flex items-center gap-2 flex-1 justify-center">
                            Save & Next <Icon name="arrow_forward" />
                          </button>
                        </div>

                        {/* Back to list on mobile */}
                        <button onClick={() => setMobileView('list')} className="lg:hidden w-full btn-ghost text-sm flex items-center justify-center gap-2">
                          <Icon name="arrow_back" /> Back to student list
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};
