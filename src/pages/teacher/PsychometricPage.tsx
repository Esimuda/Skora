import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useTeacherClasses } from '@/lib/useTeacherClasses';
import { DEFAULT_PSYCHOMETRIC_SKILLS, PSYCHOMETRIC_RATING_LABELS } from '@/types';
import { Student, Term } from '@/types';
import { getCurrentTerm, getCurrentAcademicYear } from '@/components/ui/TermSelector';

const SCORES = [1, 2, 3, 4, 5];

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-error-container text-on-error-container',
  2: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  3: 'bg-surface-container-highest text-on-surface-variant',
  4: 'bg-surface-container-low text-primary',
  5: 'bg-secondary-container/40 text-on-secondary-container',
};

const SCORE_SELECTED: Record<number, string> = {
  1: 'bg-error text-on-error shadow-card',
  2: 'bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-card',
  3: 'bg-outline text-on-primary shadow-card',
  4: 'bg-primary/80 text-on-primary shadow-card',
  5: 'bg-secondary text-on-secondary shadow-card',
};

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'V.Good', 5: 'Excel',
};

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PsychometricEntry {
  id?: string;
  studentId: string;
  classId: string;
  term: string;
  academicYear: string;
  ratings: Record<string, number>;
}

export const PsychometricPage = () => {
  const { classes, loading: loadingClasses, noClasses, schoolId } = useTeacherClasses();

  const [students, setStudents] = useState<Student[]>([]);
  const [psychometrics, setPsychometrics] = useState<PsychometricEntry[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState<Term>(() => getCurrentTerm());
  const [academicYear, setAcademicYear] = useState<string>(() => getCurrentAcademicYear());
  const [activeCategory, setActiveCategory] = useState<'affective' | 'psychomotor'>('affective');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'rating'>('list');

  useEffect(() => {
    if (!selectedClassId || !schoolId) {
      setStudents([]); setPsychometrics([]); setSavedStudents(new Set()); return;
    }
    setLoadingStudents(true);
    Promise.all([
      api.get<Student[]>(`/schools/${schoolId}/classes/${selectedClassId}/students`),
      api.get<PsychometricEntry[]>(`/schools/${schoolId}/psychometric/by-class/${selectedClassId}?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
    ]).then(([stu, psycho]) => {
      setStudents(stu);
      setPsychometrics(psycho);
      setSavedStudents(new Set(psycho.filter((p) => p.ratings && Object.keys(p.ratings).length > 0).map((p) => p.studentId)));
      setSelectedStudentId('');
      setRatings({});
      setMobileView('list');
    }).catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, term, academicYear, schoolId]);

  useEffect(() => {
    if (!selectedStudentId) { setRatings({}); return; }
    const entry = psychometrics.find((p) => p.studentId === selectedStudentId);
    if (entry?.ratings) {
      const numericRatings: Record<string, number> = {};
      for (const [key, val] of Object.entries(entry.ratings)) {
        const n = Number(val);
        if (n >= 1 && n <= 5) numericRatings[key] = n;
      }
      setRatings(numericRatings);
    } else {
      setRatings({});
    }
    setSaveStatus('idle');
  }, [selectedStudentId]);

  const affectiveSkills = DEFAULT_PSYCHOMETRIC_SKILLS.filter((s) => s.category === 'affective');
  const psychomotorSkills = DEFAULT_PSYCHOMETRIC_SKILLS.filter((s) => s.category === 'psychomotor');
  const currentSkills = activeCategory === 'affective' ? affectiveSkills : psychomotorSkills;

  const handleRate = (skillId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [skillId]: score }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedStudentId || !selectedClassId) return;
    setSaveStatus('saving'); setApiError(null);
    try {
      const saved = await api.post<PsychometricEntry>(`/schools/${schoolId}/psychometric`, {
        studentId: selectedStudentId, classId: selectedClassId, term, academicYear, ratings,
      });
      setPsychometrics((prev) => {
        const idx = prev.findIndex((p) => p.studentId === selectedStudentId);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      setSaveStatus('saved');
      setSavedStudents((prev) => new Set([...prev, selectedStudentId]));
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save'); setSaveStatus('idle');
    }
  };

  const handleNextStudent = () => {
    const idx = students.findIndex((s) => s.id === selectedStudentId);
    if (idx < students.length - 1) {
      setSelectedStudentId(students[idx + 1].id);
      setSaveStatus('idle');
    }
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setMobileView('rating');
    setActiveCategory('affective');
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const totalSkills = DEFAULT_PSYCHOMETRIC_SKILLS.length;
  const ratedCount = Object.keys(ratings).length;
  const completionPct = totalSkills > 0 ? Math.round((ratedCount / totalSkills) * 100) : 0;
  const isLastStudent = students.findIndex((s) => s.id === selectedStudentId) === students.length - 1;

  const affectiveRated = affectiveSkills.filter((sk) => ratings[sk.id] !== undefined).length;
  const psychomotorRated = psychomotorSkills.filter((sk) => ratings[sk.id] !== undefined).length;

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
            <h2 className="font-headline font-extrabold text-xl md:text-3xl text-primary tracking-tight">Psychometric Assessment</h2>
            <p className="text-on-surface-variant text-xs md:text-sm mt-0.5">Rate each student 1–5 on affective and psychomotor skills</p>
          </div>

          {/* Score scale legend */}
          <div className="flex flex-wrap gap-1.5">
            {SCORES.map((s) => (
              <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-bold ${SCORE_COLORS[s]}`}>
                {s} — {PSYCHOMETRIC_RATING_LABELS[s]}
              </span>
            ))}
          </div>

          {apiError && (
            <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm flex items-start gap-2">
              <Icon name="error" className="text-base flex-shrink-0 mt-0.5" /><span>{apiError}</span>
            </div>
          )}

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="ledger-card p-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Class</label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Loading...
                </div>
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
              <Icon name="psychology" className="text-5xl text-outline/30 mb-4" />
              <p className="font-headline font-bold text-base">Select a class to begin</p>
            </div>
          ) : loadingStudents ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading...
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="ledger-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-on-surface">Class Progress</span>
                  <span className="text-sm text-on-surface-variant">{savedStudents.size}/{students.length} scored</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: students.length > 0 ? `${(savedStudents.size / students.length) * 100}%` : '0%' }} />
                </div>
              </div>

              {/* Mobile tab switcher */}
              <div className="flex lg:hidden items-center bg-surface-container rounded-xl p-1 gap-1">
                <button onClick={() => setMobileView('list')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${mobileView === 'list' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}>
                  <Icon name="group" className="text-base" /> Students ({students.length})
                </button>
                <button onClick={() => setMobileView('rating')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${mobileView === 'rating' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}>
                  <Icon name="psychology" className="text-base" />
                  {selectedStudent ? `${selectedStudent.lastName}`.slice(0, 12) : 'Rate'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

                {/* Student list */}
                <div className={`ledger-card overflow-hidden ${mobileView === 'rating' ? 'hidden lg:block' : 'block'}`}>
                  <div className="px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low">
                    <h3 className="font-headline font-bold text-sm text-primary">
                      {classes.find((c) => c.id === selectedClassId)?.name} — Students
                    </h3>
                  </div>
                  {students.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant text-sm">No students in this class yet</div>
                  ) : (
                    <div className="divide-y divide-outline-variant/10 overflow-y-auto max-h-[60vh] lg:max-h-[580px]">
                      {students.map((student) => {
                        const isSelected = selectedStudentId === student.id;
                        const isSaved = savedStudents.has(student.id);
                        return (
                          <button key={student.id} onClick={() => handleSelectStudent(student.id)}
                            className={`w-full text-left px-4 py-3.5 transition-colors border-l-4 ${isSelected ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-surface-container-low/50'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">{student.lastName} {student.firstName}</p>
                                <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
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
                  )}
                </div>

                {/* Rating panel */}
                <div className={`ledger-card overflow-hidden ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
                  {!selectedStudent ? (
                    <div className="flex flex-col items-center justify-center h-72 text-on-surface-variant">
                      <Icon name="touch_app" className="text-5xl text-outline/30 mb-4" />
                      <p className="font-headline font-bold text-base text-center px-4">Select a student to score</p>
                    </div>
                  ) : (
                    <>
                      {/* Student header */}
                      <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-headline font-bold text-base md:text-lg text-primary truncate">
                              {selectedStudent.lastName} {selectedStudent.firstName}
                              {selectedStudent.middleName ? ` ${selectedStudent.middleName}` : ''}
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-0.5">{selectedStudent.admissionNumber}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-headline font-extrabold text-xl text-primary leading-none">{completionPct}%</p>
                              <p className="text-[10px] text-on-surface-variant">{ratedCount}/{totalSkills}</p>
                            </div>
                            <button onClick={handleSave} disabled={saveStatus === 'saving' || ratedCount === 0}
                              className={`btn-primary text-sm disabled:opacity-50 flex items-center gap-1.5 ${saveStatus === 'saved' ? 'bg-secondary from-secondary to-secondary' : ''}`}>
                              <Icon name={saveStatus === 'saved' ? 'check' : 'save'} className="text-base" />
                              <span className="hidden sm:inline">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}</span>
                            </button>
                          </div>
                        </div>
                        {/* Completion bar */}
                        <div className="mt-3 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                        </div>
                      </div>

                      {/* Category tabs */}
                      <div className="flex border-b border-outline-variant/10">
                        {([
                          { key: 'affective' as const, label: 'Affective', fullLabel: 'Affective Domain', icon: 'psychology', count: affectiveSkills.length, rated: affectiveRated },
                          { key: 'psychomotor' as const, label: 'Psychomotor', fullLabel: 'Psychomotor Domain', icon: 'directions_run', count: psychomotorSkills.length, rated: psychomotorRated },
                        ]).map((tab) => (
                          <button key={tab.key} onClick={() => setActiveCategory(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-sm font-bold transition-colors ${activeCategory === tab.key ? 'text-primary border-b-2 border-primary bg-surface-container-low/50' : 'text-on-surface-variant hover:bg-surface-container-low/30'}`}>
                            <Icon name={tab.icon} className="text-base" />
                            <span className="hidden sm:inline">{tab.fullLabel}</span>
                            <span className="sm:hidden">{tab.label}</span>
                            <span className="text-xs font-normal opacity-70">({tab.rated}/{tab.count})</span>
                          </button>
                        ))}
                      </div>

                      {/* Skills list */}
                      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                        {currentSkills.map((skill) => (
                          <div key={skill.id} className="ledger-card p-3 space-y-2">
                            {/* Skill name + current label */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-on-surface">{skill.name}</p>
                                {skill.description && <p className="text-xs text-on-surface-variant mt-0.5">{skill.description}</p>}
                              </div>
                              {ratings[skill.id] !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${SCORE_COLORS[ratings[skill.id]]}`}>
                                  {PSYCHOMETRIC_RATING_LABELS[ratings[skill.id]]}
                                </span>
                              )}
                            </div>

                            {/* Rating buttons — large tap targets */}
                            <div className="grid grid-cols-5 gap-1.5">
                              {SCORES.map((score) => {
                                const isSelected = ratings[skill.id] === score;
                                return (
                                  <button key={score} onClick={() => handleRate(skill.id, score)}
                                    className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${isSelected ? `${SCORE_SELECTED[score]} border-transparent` : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/30'}`}>
                                    <span className="text-base font-extrabold leading-none">{score}</span>
                                    <span className="text-[9px] font-bold mt-0.5 opacity-80 leading-none">{SCORE_LABELS[score]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="px-4 pb-4 space-y-2">
                        <button onClick={handleSave} disabled={saveStatus === 'saving' || ratedCount === 0}
                          className="w-full btn-primary text-sm disabled:opacity-50 flex items-center justify-center gap-2 py-3">
                          <Icon name={saveStatus === 'saved' ? 'check_circle' : 'save'} />
                          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save Ratings'}
                        </button>
                        <button onClick={() => { handleSave(); setTimeout(handleNextStudent, 500); }}
                          disabled={isLastStudent}
                          className="w-full btn-ghost text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                          Save & Next Student <Icon name="arrow_forward" />
                        </button>
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
