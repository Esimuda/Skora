import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDataStore, getGrade } from '@/store/dataStore';
import { Term } from '@/types';

const CURRENT_TERM: Term = 'first';
const CURRENT_YEAR = '2024/2025';

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
  const {
    classes,
    getStudentsByClass,
    getSubjectsByClass,
    saveScore,
    getScores,
  } = useDataStore();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scores, setScores] = useState<LocalScore[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const students = getStudentsByClass(selectedClassId);
  const subjects = getSubjectsByClass(selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Load saved scores when class/subject changes
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setScores([]);
      return;
    }
    const saved = getScores(selectedClassId, selectedSubjectId, CURRENT_TERM, CURRENT_YEAR);
    const initialized = students.map((student) => {
      const existing = saved.find((s) => s.studentId === student.id);
      if (existing) {
        return {
          studentId: student.id,
          ca1: existing.ca1,
          ca2: existing.ca2,
          exam: existing.exam,
          total: existing.total,
          grade: existing.grade,
          remark: existing.remark,
        };
      }
      return { studentId: student.id, ca1: '' as const, ca2: '' as const, exam: '' as const, total: 0, grade: '', remark: '' };
    });
    setScores(initialized);
    setSavedAt(null);
  }, [selectedClassId, selectedSubjectId]);

  const handleScoreChange = (studentId: string, field: ScoreField, value: string) => {
    const max = field === 'exam' ? 60 : 20;
    const num = value === '' ? '' : Math.min(max, Math.max(0, Number(value)));
    setScores((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const updated = { ...s, [field]: num };
        const ca1 = updated.ca1 === '' ? 0 : Number(updated.ca1);
        const ca2 = updated.ca2 === '' ? 0 : Number(updated.ca2);
        const exam = updated.exam === '' ? 0 : Number(updated.exam);
        const total = ca1 + ca2 + exam;
        const { grade, remark } = getGrade(total);
        return { ...updated, total, grade, remark };
      })
    );
    setSavedAt(null);
  };

  const handleSaveAll = () => {
    if (!selectedClassId || !selectedSubjectId) return;
    setSaving(true);
    setTimeout(() => {
      scores.forEach((s) => {
        const ca1 = s.ca1 === '' ? 0 : Number(s.ca1);
        const ca2 = s.ca2 === '' ? 0 : Number(s.ca2);
        const exam = s.exam === '' ? 0 : Number(s.exam);
        const total = ca1 + ca2 + exam;
        const { grade, remark } = getGrade(total);
        saveScore({
          studentId: s.studentId,
          subjectId: selectedSubjectId,
          classId: selectedClassId,
          term: CURRENT_TERM,
          academicYear: CURRENT_YEAR,
          ca1, ca2, exam, total, grade, remark,
        });
      });
      setSaving(false);
      setSavedAt(new Date().toLocaleTimeString('en-NG'));
    }, 400);
  };

  const filledCount = scores.filter(
    (s) => s.ca1 !== '' && s.ca2 !== '' && s.exam !== ''
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Score Entry
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Enter CA and exam scores per subject — auto-saved to device
            </p>
          </div>
          {selectedClassId && selectedSubjectId && scores.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Icon name="save" /> Save All Scores</>
              )}
            </button>
          )}
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); }}
              className="input-inset"
            >
              <option value="">— Choose a class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId}
              className="input-inset disabled:opacity-50"
            >
              <option value="">— Choose a subject —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
              ))}
            </select>
            {selectedClassId && subjects.length === 0 && (
              <p className="mt-2 text-xs text-on-tertiary-container">
                No subjects yet — add subjects first
              </p>
            )}
          </div>
        </div>

        {/* Score table */}
        {selectedClassId && selectedSubjectId && (
          <>
            {students.length === 0 ? (
              <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
                <Icon name="group" className="text-5xl text-outline/30 mb-4" />
                <p className="font-headline font-bold text-lg">No students in this class</p>
                <p className="text-sm mt-1">Add students first before entering scores</p>
              </div>
            ) : (
              <div className="ledger-card overflow-hidden">
                {/* Table header */}
                <div className="px-4 md:px-6 py-4 bg-surface-container-low flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-on-surface">
                      {selectedSubject?.name}
                      {selectedSubject?.code && (
                        <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-full">
                          {selectedSubject.code}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {filledCount} of {students.length} students scored
                      {savedAt && <span className="ml-2 text-secondary font-medium">· Saved {savedAt}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="px-2 py-1 bg-surface-container rounded-lg font-bold">CA1/20</span>
                    <span className="px-2 py-1 bg-surface-container rounded-lg font-bold">CA2/20</span>
                    <span className="px-2 py-1 bg-surface-container rounded-lg font-bold">Exam/60</span>
                  </div>
                </div>

                {/* ── Desktop table (md+) ── */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_5rem_6rem] gap-3 px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                    <span />
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Student</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">CA1</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">CA2</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Exam</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Total</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Grade</span>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {scores.map((score, idx) => {
                      const student = students.find((s) => s.id === score.studentId);
                      if (!student) return null;
                      const isFilled = score.ca1 !== '' && score.ca2 !== '' && score.exam !== '';
                      return (
                        <div
                          key={score.studentId}
                          className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_5rem_6rem] gap-3 items-center px-6 py-3 hover:bg-surface-container-low/40 transition-colors"
                        >
                          <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-on-surface text-sm">{student.lastName} {student.firstName}</p>
                            <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
                          </div>
                          {(['ca1', 'ca2', 'exam'] as ScoreField[]).map((field) => (
                            <input
                              key={field}
                              type="number"
                              min={0}
                              max={field === 'exam' ? 60 : 20}
                              value={score[field]}
                              onChange={(e) => handleScoreChange(score.studentId, field, e.target.value)}
                              placeholder="—"
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
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${score.total >= 75 ? 'badge-validated' : score.total >= 50 ? 'badge-pending' : 'badge-error'}`}>
                                {score.grade}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/30 text-sm">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Mobile cards (< md) ── */}
                <div className="md:hidden divide-y divide-outline-variant/10">
                  {scores.map((score, idx) => {
                    const student = students.find((s) => s.id === score.studentId);
                    if (!student) return null;
                    const isFilled = score.ca1 !== '' && score.ca2 !== '' && score.exam !== '';
                    return (
                      <div key={score.studentId} className="p-4 space-y-3">
                        {/* Student row */}
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-on-surface text-sm truncate">{student.lastName} {student.firstName}</p>
                            <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
                          </div>
                          {isFilled && (
                            <div className="text-right flex-shrink-0">
                              <p className={`font-headline font-extrabold text-xl leading-none ${score.total >= 50 ? 'text-secondary' : 'text-error'}`}>
                                {score.total}
                              </p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${score.total >= 75 ? 'badge-validated' : score.total >= 50 ? 'badge-pending' : 'badge-error'}`}>
                                {score.grade}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Score inputs */}
                        <div className="grid grid-cols-3 gap-2">
                          {(['ca1', 'ca2', 'exam'] as ScoreField[]).map((field) => (
                            <div key={field}>
                              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                                {field === 'ca1' ? 'CA1 /20' : field === 'ca2' ? 'CA2 /20' : 'Exam /60'}
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={field === 'exam' ? 60 : 20}
                                value={score[field]}
                                onChange={(e) => handleScoreChange(score.studentId, field, e.target.value)}
                                placeholder="—"
                                className="w-full bg-surface-container-highest border-none rounded-xl px-2 py-3 text-base text-center font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer save */}
                <div className="px-4 md:px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-between gap-3">
                  <p className="text-xs text-on-surface-variant hidden sm:block">
                    Scores are saved per subject.
                  </p>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="btn-primary text-sm disabled:opacity-60 flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    {saving ? (
                      <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                    ) : (
                      <><Icon name="save" /> Save All Scores</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {(!selectedClassId || !selectedSubjectId) && (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="edit_note" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class and subject to begin</p>
            <p className="text-sm mt-1">Scores save automatically to your device</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ScoreEntryPage;