import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useTeacherClasses } from '@/lib/useTeacherClasses';
import { getGrade } from '@/store/dataStore';
import { Subject, Student, Score, Term } from '@/types';
import { TermSelector, getCurrentTerm, getCurrentAcademicYear } from '@/components/ui/TermSelector';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

type ScoreField = 'ca1' | 'ca2' | 'exam';

interface LocalScore {
  studentId: string;
  ca1: number | '';
  ca2: number | '';
  exam: number | '';
  total: number;
  grade: string;
  remark: string;
}

const ScoreEntryPage = () => {
  const { classes, loading: loadingClasses, noClasses, schoolId } = useTeacherClasses();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<LocalScore[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [term, setTerm] = useState<Term>(() => getCurrentTerm());
  const [academicYear, setAcademicYear] = useState<string>(() => getCurrentAcademicYear());

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClassId || !schoolId) { setSubjects([]); setStudents([]); setScores([]); return; }
    setApiError(null);
    api.get<Subject[]>(`/schools/${schoolId}/classes/${selectedClassId}/subjects`).then(setSubjects).catch((e) => setApiError(e.message ?? 'Failed to load subjects'));
    api.get<Student[]>(`/schools/${schoolId}/classes/${selectedClassId}/students`).then(setStudents).catch((e) => setApiError(e.message ?? 'Failed to load students'));
  }, [selectedClassId, schoolId]);

  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !schoolId || students.length === 0) { setScores([]); return; }
    setLoadingData(true);
    setApiError(null);
    api.get<Score[]>(`/schools/${schoolId}/scores/by-subject/${selectedClassId}/${selectedSubjectId}?term=${term}&academicYear=${encodeURIComponent(academicYear)}`)
      .then((saved) => {
        setScores(students.map((student) => {
          const existing = saved.find((s) => s.studentId === student.id);
          if (existing) return { studentId: student.id, ca1: existing.ca1, ca2: existing.ca2, exam: existing.exam, total: existing.total, grade: existing.grade, remark: existing.remark };
          return { studentId: student.id, ca1: '', ca2: '', exam: '', total: 0, grade: '', remark: '' };
        }));
        setSavedAt(null);
      })
      .catch(() => setScores(students.map((s) => ({ studentId: s.id, ca1: '', ca2: '', exam: '', total: 0, grade: '', remark: '' }))))
      .finally(() => setLoadingData(false));
  }, [selectedClassId, selectedSubjectId, term, academicYear, students]);

  const handleScoreChange = (studentId: string, field: ScoreField, value: string) => {
    const max = field === 'exam' ? 60 : 20;
    const num = value === '' ? '' : Math.min(max, Math.max(0, Number(value)));
    setScores((prev) => prev.map((s) => {
      if (s.studentId !== studentId) return s;
      const updated = { ...s, [field]: num };
      const ca1 = updated.ca1 === '' ? 0 : Number(updated.ca1);
      const ca2 = updated.ca2 === '' ? 0 : Number(updated.ca2);
      const exam = updated.exam === '' ? 0 : Number(updated.exam);
      const total = ca1 + ca2 + exam;
      const { grade, remark } = getGrade(total);
      return { ...updated, total, grade, remark };
    }));
    setSavedAt(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, studentIndex: number, field: ScoreField) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const fieldOrder: ScoreField[] = ['ca1', 'ca2', 'exam'];
    const currentFieldIndex = fieldOrder.indexOf(field);
    const isLastField = currentFieldIndex === fieldOrder.length - 1;
    const nextStudentIndex = isLastField ? studentIndex + 1 : studentIndex;
    const nextField: ScoreField = isLastField ? 'ca1' : fieldOrder[currentFieldIndex + 1];
    if (nextStudentIndex >= scores.length) return;
    const nextInput = document.getElementById(`score-${scores[nextStudentIndex].studentId}-${nextField}`) as HTMLInputElement | null;
    nextInput?.focus(); nextInput?.select();
  };

  const handleSaveAll = async () => {
    if (!selectedClassId || !selectedSubjectId) return;
    const incomplete = scores.filter((s) => s.ca1 === '' || s.ca2 === '' || s.exam === '');
    if (incomplete.length > 0) {
      const names = incomplete.map((s) => { const st = students.find((t) => t.id === s.studentId); return st ? `${st.lastName} ${st.firstName}` : s.studentId; });
      setApiError(`Cannot save — ${incomplete.length} student${incomplete.length > 1 ? 's' : ''} have incomplete scores: ${names.join(', ')}. All three fields must be filled.`);
      return;
    }
    setSaving(true); setApiError(null);
    try {
      await api.post(`/schools/${schoolId}/scores/bulk`, {
        scores: scores.map((s) => ({ studentId: s.studentId, subjectId: selectedSubjectId, classId: selectedClassId, term, academicYear, ca1: Number(s.ca1), ca2: Number(s.ca2), exam: Number(s.exam) })),
      });
      setSavedAt(new Date().toLocaleTimeString('en-NG'));
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save scores');
    } finally { setSaving(false); }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const filledCount = scores.filter((s) => s.ca1 !== '' && s.ca2 !== '' && s.exam !== '').length;
  const isReady = selectedClassId && selectedSubjectId && scores.length > 0;

  return (
    <DashboardLayout>
      {noClasses && (
        <div className="rounded-xl bg-error-container text-on-error-container px-5 py-4 flex items-start gap-3">
          <Icon name="warning" className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">No Classes Assigned</p>
            <p className="text-sm mt-0.5">You have not been assigned to any class yet. Contact your principal to get assigned.</p>
          </div>
        </div>
      )}

      {!noClasses && (
        <div className="space-y-4 animate-fade-in">

          {/* Page header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline font-extrabold text-xl md:text-3xl text-primary tracking-tight">Score Entry</h2>
              <p className="text-on-surface-variant text-xs md:text-sm mt-0.5">Enter CA and exam scores per subject</p>
            </div>
          </div>

          {apiError && (
            <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
              <Icon name="error" className="text-base flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Term selector */}
          <TermSelector term={term} academicYear={academicYear} onTermChange={setTerm} onAcademicYearChange={setAcademicYear} />

          {/* Class + Subject selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ledger-card p-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Class</label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 text-on-surface-variant text-sm"><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Loading...</div>
              ) : (
                <select value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); }} className="input-inset text-base">
                  <option value="">— Choose class —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="ledger-card p-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Subject</label>
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId} className="input-inset text-base disabled:opacity-50">
                <option value="">— Choose subject —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
              </select>
              {selectedClassId && subjects.length === 0 && <p className="mt-2 text-xs text-on-tertiary-container">No subjects yet — add subjects first</p>}
            </div>
          </div>

          {/* Empty state */}
          {!isReady && !loadingData && (
            <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Icon name="edit_note" className="text-5xl text-outline/30 mb-3" />
              <p className="font-headline font-bold text-base">Select a class and subject to begin</p>
            </div>
          )}

          {/* Score table */}
          {isReady && (
            <>
              {loadingData ? (
                <div className="flex items-center justify-center py-16 text-on-surface-variant">
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading scores...
                </div>
              ) : students.length === 0 ? (
                <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
                  <Icon name="group" className="text-5xl text-outline/30 mb-3" />
                  <p className="font-headline font-bold text-base">No students in this class</p>
                  <p className="text-sm mt-1">Add students first before entering scores</p>
                </div>
              ) : (
                <div className="ledger-card overflow-hidden">
                  {/* Header bar */}
                  <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-on-surface text-sm">
                        {selectedSubject?.name}
                        {selectedSubject?.code && <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-full">{selectedSubject.code}</span>}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {filledCount}/{students.length} scored
                        {savedAt && <span className="ml-2 text-secondary font-medium">· Saved {savedAt}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-bold">
                      <span className="px-2 py-1 bg-surface-container rounded-lg">CA1/20</span>
                      <span className="px-2 py-1 bg-surface-container rounded-lg">CA2/20</span>
                      <span className="px-2 py-1 bg-surface-container rounded-lg">Exam/60</span>
                    </div>
                  </div>

                  {/* Desktop table — hidden on mobile */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_5rem_6rem] gap-3 px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                      <span />
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Student</span>
                      {['CA1', 'CA2', 'Exam', 'Total', 'Grade'].map((h) => (
                        <span key={h} className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">{h}</span>
                      ))}
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {scores.map((score, idx) => {
                        const student = students.find((s) => s.id === score.studentId);
                        if (!student) return null;
                        const isFilled = score.ca1 !== '' && score.ca2 !== '' && score.exam !== '';
                        return (
                          <div key={score.studentId} className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_5rem_6rem] gap-3 items-center px-6 py-3 hover:bg-surface-container-low/40 transition-colors">
                            <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-on-surface text-sm">{student.lastName} {student.firstName}</p>
                              <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
                            </div>
                            {(['ca1', 'ca2', 'exam'] as ScoreField[]).map((field) => (
                              <input key={field} id={`score-${score.studentId}-${field}`}
                                type="number" min={0} max={field === 'exam' ? 60 : 20}
                                value={score[field]} onChange={(e) => handleScoreChange(score.studentId, field, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, idx, field)} placeholder="—"
                                className="w-full bg-surface-container-highest border-none rounded-lg px-2 py-2 text-sm text-center font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                              />
                            ))}
                            <div className="text-center">
                              <span className={`font-headline font-extrabold text-lg ${isFilled ? (score.total >= 50 ? 'text-secondary' : 'text-error') : 'text-on-surface-variant/30'}`}>
                                {isFilled ? score.total : '—'}
                              </span>
                            </div>
                            <div className="text-center">
                              {isFilled ? (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${score.total >= 75 ? 'badge-validated' : score.total >= 50 ? 'badge-pending' : 'badge-error'}`}>{score.grade}</span>
                              ) : <span className="text-on-surface-variant/30 text-sm">—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile cards — shown only on small screens */}
                  <div className="md:hidden divide-y divide-outline-variant/10">
                    {scores.map((score, idx) => {
                      const student = students.find((s) => s.id === score.studentId);
                      if (!student) return null;
                      const isFilled = score.ca1 !== '' && score.ca2 !== '' && score.exam !== '';
                      return (
                        <div key={score.studentId} className="p-4 space-y-3">
                          {/* Student name row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant flex-shrink-0">{idx + 1}</span>
                              <div className="min-w-0">
                                <p className="font-bold text-on-surface text-sm truncate">{student.lastName} {student.firstName}</p>
                                <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
                              </div>
                            </div>
                            {isFilled && (
                              <div className="flex-shrink-0 text-right">
                                <p className={`font-headline font-extrabold text-xl leading-none ${score.total >= 50 ? 'text-secondary' : 'text-error'}`}>{score.total}</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${score.total >= 75 ? 'badge-validated' : score.total >= 50 ? 'badge-pending' : 'badge-error'}`}>{score.grade}</span>
                              </div>
                            )}
                          </div>

                          {/* Score inputs — large tap targets */}
                          <div className="grid grid-cols-3 gap-2">
                            {(['ca1', 'ca2', 'exam'] as ScoreField[]).map((field) => (
                              <div key={field}>
                                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                                  {field === 'ca1' ? 'CA1 /20' : field === 'ca2' ? 'CA2 /20' : 'Exam /60'}
                                </label>
                                <input
                                  id={`score-${score.studentId}-${field}`}
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min={0}
                                  max={field === 'exam' ? 60 : 20}
                                  value={score[field]}
                                  onChange={(e) => handleScoreChange(score.studentId, field, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, idx, field)}
                                  onFocus={(e) => e.target.select()}
                                  placeholder="—"
                                  className="w-full bg-surface-container-highest border-2 border-transparent rounded-xl px-2 py-3 text-lg text-center font-bold text-on-surface outline-none focus:border-primary transition-all"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer save button */}
                  <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/10">
                    <button onClick={handleSaveAll} disabled={saving}
                      className="btn-primary text-sm disabled:opacity-60 flex items-center gap-2 w-full justify-center py-3">
                      {saving ? (
                        <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                      ) : filledCount < scores.length ? (
                        <><Icon name="save" /> Save Scores ({filledCount}/{scores.length} filled)</>
                      ) : (
                        <><Icon name="save" /> Save All Scores</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ScoreEntryPage;
