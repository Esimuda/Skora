import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { DEFAULT_PSYCHOMETRIC_SKILLS, PSYCHOMETRIC_RATING_LABELS } from '@/types';
import { Class, Student, Term } from '@/types';

const SCORES = [1, 2, 3, 4, 5];

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-error-container text-on-error-container',
  2: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  3: 'bg-surface-container-highest text-on-surface-variant',
  4: 'bg-surface-container-low text-primary',
  5: 'bg-secondary-container/40 text-on-secondary-container',
};

const SCORE_SELECTED: Record<number, string> = {
  1: 'bg-error text-on-error scale-110 shadow-card',
  2: 'bg-tertiary-fixed-dim text-on-tertiary-fixed scale-110 shadow-card',
  3: 'bg-outline text-on-primary scale-110 shadow-card',
  4: 'bg-primary/80 text-on-primary scale-110 shadow-card',
  5: 'bg-secondary text-on-secondary scale-110 shadow-card',
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
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [psychometrics, setPsychometrics] = useState<PsychometricEntry[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState<Term>('first');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [activeCategory, setActiveCategory] = useState<'affective' | 'psychomotor'>('affective');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    api.get<Class[]>(`/schools/${schoolId}/classes`)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClassId || !schoolId) { setStudents([]); setPsychometrics([]); setSavedStudents(new Set()); return; }
    setLoadingStudents(true);
    Promise.all([
      api.get<Student[]>(`/schools/${schoolId}/classes/${selectedClassId}/students`),
      api.get<PsychometricEntry[]>(`/schools/${schoolId}/psychometric/by-class/${selectedClassId}?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
    ]).then(([stu, psycho]) => {
      setStudents(stu);
      setPsychometrics(psycho);
      const saved = new Set<string>(psycho.filter((p) => p.ratings && Object.keys(p.ratings).length > 0).map((p) => p.studentId));
      setSavedStudents(saved);
      setSelectedStudentId('');
      setRatings({});
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
    setSaveStatus('saving');
    setApiError(null);
    try {
      const saved = await api.post<PsychometricEntry>(`/schools/${schoolId}/psychometric`, {
        studentId: selectedStudentId,
        classId: selectedClassId,
        term,
        academicYear,
        ratings,
      });
      setPsychometrics((prev) => {
        const idx = prev.findIndex((p) => p.studentId === selectedStudentId);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      setSaveStatus('saved');
      setSavedStudents((prev) => new Set([...prev, selectedStudentId]));
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save');
      setSaveStatus('idle');
    }
  };

  const handleNextStudent = () => {
    const idx = students.findIndex((s) => s.id === selectedStudentId);
    if (idx < students.length - 1) setSelectedStudentId(students[idx + 1].id);
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const totalSkills = DEFAULT_PSYCHOMETRIC_SKILLS.length;
  const ratedCount = Object.keys(ratings).length;
  const completionPct = totalSkills > 0 ? Math.round((ratedCount / totalSkills) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Psychometric Assessment</h2>
          <p className="text-on-surface-variant text-sm mt-1">Score each student 1–5 on affective and psychomotor skills</p>
        </div>

        {/* Score scale */}
        <div className="flex flex-wrap gap-2">
          {SCORES.map((s) => (
            <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-bold ${SCORE_COLORS[s]}`}>
              {s} — {PSYCHOMETRIC_RATING_LABELS[s]}
            </span>
          ))}
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
            <Icon name="psychology" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to begin</p>
          </div>
        ) : loadingStudents ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading...
          </div>
        ) : (
          <>
            {/* Class progress */}
            <div className="ledger-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-on-surface">Class Progress</span>
                <span className="text-sm text-on-surface-variant">{savedStudents.size} of {students.length} students scored</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: students.length > 0 ? `${(savedStudents.size / students.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-[260px_1fr] gap-6">

              {/* Student list */}
              <div className="ledger-card overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/10">
                  <h3 className="font-headline font-bold text-sm text-primary">
                    {classes.find((c) => c.id === selectedClassId)?.name} — Students
                  </h3>
                </div>
                {students.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant text-sm">No students in this class yet</div>
                ) : (
                  <div className="divide-y divide-outline-variant/10 overflow-y-auto max-h-[500px]">
                    {students.map((student) => {
                      const isSelected = selectedStudentId === student.id;
                      const isSaved = savedStudents.has(student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full text-left px-5 py-3 transition-colors ${isSelected ? 'bg-surface-container-low border-l-4 border-primary' : 'border-l-4 border-transparent hover:bg-surface-container-low/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-on-surface">{student.lastName} {student.firstName}</p>
                              <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
                            </div>
                            {isSaved && <Icon name="check_circle" className="text-secondary text-base flex-shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rating panel */}
              <div className="ledger-card overflow-hidden">
                {!selectedStudent ? (
                  <div className="flex flex-col items-center justify-center h-80 text-on-surface-variant">
                    <Icon name="touch_app" className="text-5xl text-outline/30 mb-4" />
                    <p className="font-headline font-bold text-lg">Select a student to score</p>
                  </div>
                ) : (
                  <>
                    <div className="p-5 border-b border-outline-variant/10 bg-surface-container-low">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-headline font-bold text-lg text-primary">
                            {selectedStudent.lastName} {selectedStudent.firstName}
                            {selectedStudent.middleName ? ` ${selectedStudent.middleName}` : ''}
                          </h3>
                          <p className="text-sm text-on-surface-variant">{selectedStudent.admissionNumber}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-headline font-extrabold text-2xl text-primary">{completionPct}%</p>
                            <p className="text-xs text-on-surface-variant">{ratedCount}/{totalSkills} traits</p>
                          </div>
                          <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saving' || ratedCount === 0}
                            className={`btn-primary text-sm disabled:opacity-50 flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-secondary from-secondary to-secondary' : ''}`}
                          >
                            <Icon name={saveStatus === 'saved' ? 'check' : 'save'} />
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                      </div>
                    </div>

                    {/* Category tabs */}
                    <div className="flex border-b border-outline-variant/10">
                      {([
                        { key: 'affective', label: 'Affective Domain', icon: 'psychology', count: affectiveSkills.length },
                        { key: 'psychomotor', label: 'Psychomotor Domain', icon: 'directions_run', count: psychomotorSkills.length },
                      ] as const).map((tab) => {
                        const ratedInTab = (tab.key === 'affective' ? affectiveSkills : psychomotorSkills).filter((sk) => ratings[sk.id] !== undefined).length;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveCategory(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold transition-colors ${activeCategory === tab.key ? 'text-primary border-b-2 border-primary bg-surface-container-low/50' : 'text-on-surface-variant hover:bg-surface-container-low/30'}`}
                          >
                            <Icon name={tab.icon} className="text-base" />
                            {tab.label}
                            <span className="text-xs font-normal text-on-surface-variant">({ratedInTab}/{tab.count})</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-5 space-y-5">
                      {currentSkills.map((skill) => (
                        <div key={skill.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-bold text-on-surface">{skill.name}</p>
                              {skill.description && <p className="text-xs text-on-surface-variant">{skill.description}</p>}
                            </div>
                            {ratings[skill.id] !== undefined && (
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${SCORE_COLORS[ratings[skill.id]]}`}>
                                {PSYCHOMETRIC_RATING_LABELS[ratings[skill.id]]}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {SCORES.map((score) => {
                              const isSelected = ratings[skill.id] === score;
                              return (
                                <button
                                  key={score}
                                  onClick={() => handleRate(skill.id, score)}
                                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${isSelected ? `${SCORE_SELECTED[score]} border-transparent` : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/30 hover:text-primary'}`}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        onClick={() => { handleSave(); setTimeout(handleNextStudent, 500); }}
                        disabled={students.findIndex((s) => s.id === selectedStudentId) === students.length - 1}
                        className="w-full btn-ghost text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        Save & Next Student <Icon name="arrow_forward" />
                      </button>
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
