import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Class, Term } from '@/types';

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
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [classResults, setClassResults] = useState<ComputedResult[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState<Term>('first');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [commentText, setCommentText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    api.get<Class[]>(`/schools/${schoolId}/classes`)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClassId || !schoolId) {
      setClassResults([]);
      setComments([]);
      setSelectedStudentId('');
      setSavedStudents(new Set());
      return;
    }
    setLoadingResults(true);
    setApiError(null);
    Promise.all([
      api.get<ComputedResult[]>(`/schools/${schoolId}/results/${selectedClassId}/computed?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
      api.get<Comment[]>(`/schools/${schoolId}/comments/by-class/${selectedClassId}?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
    ]).then(([results, cmts]) => {
      setClassResults(results);
      setComments(cmts);
      const saved = new Set<string>(cmts.filter((c) => c.teacherComment?.trim()).map((c) => c.studentId));
      setSavedStudents(saved);
      setSelectedStudentId('');
      setCommentText('');
    }).catch((e) => {
      setApiError(e.message ?? 'Failed to load data');
    }).finally(() => setLoadingResults(false));
  }, [selectedClassId, term, academicYear, schoolId]);

  useEffect(() => {
    if (!selectedStudentId) { setCommentText(''); return; }
    const existing = comments.find((c) => c.studentId === selectedStudentId);
    setCommentText(existing?.teacherComment ?? '');
    setSaveStatus('idle');
  }, [selectedStudentId]);

  const selectedResult = classResults.find((r) => r.student.id === selectedStudentId);

  const handleSave = async () => {
    if (!selectedStudentId || !selectedClassId) return;
    setSaveStatus('saving');
    setApiError(null);
    const existing = comments.find((c) => c.studentId === selectedStudentId);
    try {
      const saved = await api.post<Comment>(`/schools/${schoolId}/comments`, {
        studentId: selectedStudentId,
        classId: selectedClassId,
        term,
        academicYear,
        teacherComment: commentText.trim(),
        principalComment: existing?.principalComment,
      });
      setComments((prev) => {
        const idx = prev.findIndex((c) => c.studentId === selectedStudentId);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      setSaveStatus('saved');
      if (commentText.trim()) setSavedStudents((prev) => new Set([...prev, selectedStudentId]));
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save comment');
      setSaveStatus('idle');
    }
  };

  const handleNextStudent = () => {
    const idx = classResults.findIndex((r) => r.student.id === selectedStudentId);
    if (idx < classResults.length - 1) setSelectedStudentId(classResults[idx + 1].student.id);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Teacher Comments</h2>
          <p className="text-on-surface-variant text-sm mt-1">Write a comment for each student — appears on their result sheet</p>
        </div>

        {apiError && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>
        )}

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Select Class</label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Loading...
              </div>
            ) : (
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="input-inset">
                <option value="">— Choose a class —</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value as Term)} className="input-inset">
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </select>
          </div>
          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Academic Year</label>
            <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2024/2025" className="input-inset" />
          </div>
        </div>

        {!selectedClassId ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="chat" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to write comments</p>
          </div>
        ) : loadingResults ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading...
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="ledger-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-on-surface">Comments Progress</span>
                <span className="text-sm text-on-surface-variant">{savedStudents.size} of {classResults.length} students commented</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: classResults.length > 0 ? `${(savedStudents.size / classResults.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-[260px_1fr] gap-6">

              {/* Student list */}
              <div className="ledger-card overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/10">
                  <h3 className="font-headline font-bold text-sm text-primary">Students by Position</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Sorted by class performance</p>
                </div>
                {classResults.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant text-sm">
                    <p>No results found</p>
                    <p className="mt-1 text-xs">Enter scores first so positions can be calculated</p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/10 overflow-y-auto max-h-[500px]">
                    {classResults.map((result) => {
                      const isSelected = selectedStudentId === result.student.id;
                      const isSaved = savedStudents.has(result.student.id);
                      return (
                        <button
                          key={result.student.id}
                          onClick={() => setSelectedStudentId(result.student.id)}
                          className={`w-full text-left px-5 py-3 transition-colors ${isSelected ? 'bg-surface-container-low border-l-4 border-primary' : 'border-l-4 border-transparent hover:bg-surface-container-low/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary">{formatPosition(result.position)}</span>
                                <p className="text-sm font-bold text-on-surface truncate">{result.student.lastName} {result.student.firstName}</p>
                              </div>
                              <p className="text-xs text-on-surface-variant mt-0.5">{result.percentage.toFixed(1)}% · {result.student.admissionNumber}</p>
                            </div>
                            {isSaved && <Icon name="check_circle" className="text-secondary text-base flex-shrink-0 ml-2" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comment panel */}
              <div className="ledger-card overflow-hidden">
                {!selectedResult ? (
                  <div className="flex flex-col items-center justify-center h-80 text-on-surface-variant">
                    <Icon name="draw" className="text-5xl text-outline/30 mb-4" />
                    <p className="font-headline font-bold text-lg">Select a student to write their comment</p>
                  </div>
                ) : (
                  <>
                    <div className="p-5 border-b border-outline-variant/10 bg-surface-container-low">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-headline font-bold text-lg text-primary">
                            {selectedResult.student.lastName} {selectedResult.student.firstName}
                            {selectedResult.student.middleName ? ` ${selectedResult.student.middleName}` : ''}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/5 text-primary">{formatPosition(selectedResult.position)} Position</span>
                            <span className="text-xs text-on-surface-variant">{selectedResult.percentage.toFixed(1)}%</span>
                            <span className="text-xs text-on-surface-variant">{selectedResult.totalScore}/{selectedResult.totalPossible} marks</span>
                            <span className="text-xs text-on-surface-variant">Class of {selectedResult.totalStudents}</span>
                          </div>
                        </div>
                        <button
                          onClick={handleSave}
                          disabled={saveStatus === 'saving'}
                          className={`btn-primary text-sm flex items-center gap-2 disabled:opacity-60 flex-shrink-0 ${saveStatus === 'saved' ? 'from-secondary to-secondary bg-secondary' : ''}`}
                        >
                          <Icon name={saveStatus === 'saved' ? 'check' : 'save'} />
                          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      <div className="p-4 bg-surface-container-low rounded-xl">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Suggested based on performance</p>
                        <p className="text-sm text-on-surface italic mb-3">"{getSuggestedComment(selectedResult)}"</p>
                        <button onClick={() => { setCommentText(getSuggestedComment(selectedResult)); setSaveStatus('idle'); }} className="text-xs text-primary font-bold hover:underline">Use this comment</button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Teacher's Comment</label>
                        <textarea
                          value={commentText}
                          onChange={(e) => { setCommentText(e.target.value); setSaveStatus('idle'); }}
                          rows={4}
                          placeholder="Write your comment for this student..."
                          className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
                        />
                        <p className="text-xs text-on-surface-variant mt-1.5">{commentText.length} characters</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Quick Comments</p>
                        <div className="space-y-2">
                          {QUICK_COMMENTS.map((qc, i) => (
                            <button
                              key={i}
                              onClick={() => { setCommentText(qc); setSaveStatus('idle'); }}
                              className={`w-full text-left text-xs p-3 rounded-xl border-2 transition-colors ${commentText === qc ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low text-on-surface-variant'}`}
                            >
                              "{qc}"
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2"><Icon name="save" /> Save Comment</button>
                        <button
                          onClick={() => { handleSave(); setTimeout(handleNextStudent, 500); }}
                          disabled={classResults.findIndex((r) => r.student.id === selectedStudentId) === classResults.length - 1}
                          className="btn-ghost text-sm disabled:opacity-40 flex items-center gap-2"
                        >
                          Save & Next <Icon name="arrow_forward" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
