import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Class, Student, Term } from '@/types';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const AttendancePage = () => {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [term, setTerm] = useState<Term>('first');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [daysOpened, setDaysOpened] = useState<number | ''>('');
  const [studentDays, setStudentDays] = useState<Record<string, number | ''>>({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) { setLoadingClasses(false); return; }
    api.get<Class[]>(`/schools/${schoolId}/classes`)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClassId || !schoolId) { setStudents([]); return; }
    setLoadingStudents(true);
    Promise.all([
      api.get<Student[]>(`/schools/${schoolId}/classes/${selectedClassId}/students`),
      api.get<any[]>(`/schools/${schoolId}/attendance/by-class/${selectedClassId}?term=${term}&academicYear=${encodeURIComponent(academicYear)}`),
    ]).then(([stu, att]) => {
      setStudents(stu);
      const initial: Record<string, number | ''> = {};
      let opened: number | '' = '';
      stu.forEach((s) => {
        const existing = att.find((a: any) => a.studentId === s.id);
        if (existing) {
          initial[s.id] = existing.daysPresent;
          if (!opened) opened = existing.daysSchoolOpened;
        } else {
          initial[s.id] = '';
        }
      });
      setStudentDays(initial);
      setDaysOpened(opened);
      setSaved(false);
    }).catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, term, academicYear, schoolId]);

  const handleSave = async () => {
    if (!selectedClassId || daysOpened === '') return;
    setSaving(true);
    setSaved(false);
    setApiError(null);
    try {
      await Promise.all(students.map((s) =>
        api.post(`/schools/${schoolId}/attendance`, {
          studentId: s.id,
          classId: selectedClassId,
          term,
          academicYear,
          daysSchoolOpened: Number(daysOpened),
          daysPresent: studentDays[s.id] === '' ? 0 : Number(studentDays[s.id]),
        })
      ));
      setSaved(true);
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Attendance</h2>
            <p className="text-on-surface-variant text-sm mt-1">Record days school opened and each student's attendance — appears on result sheet</p>
          </div>
          {selectedClassId && students.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving || daysOpened === ''}
              className={`btn-primary text-sm flex items-center gap-2 disabled:opacity-60 ${saved ? 'from-secondary to-secondary bg-secondary' : ''}`}
            >
              {saving ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                : saved ? <><Icon name="check" /> Saved</>
                : <><Icon name="save" /> Save Attendance</>}
            </button>
          )}
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
              <select value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSaved(false); setApiError(null); }} className="input-inset">
                <option value="">— Choose a class —</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Term</label>
            <select value={term} onChange={(e) => { setTerm(e.target.value as Term); setSaved(false); }} className="input-inset">
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </select>
          </div>
          <div className="ledger-card p-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Academic Year</label>
            <input value={academicYear} onChange={(e) => { setAcademicYear(e.target.value); setSaved(false); }} placeholder="e.g. 2024/2025" className="input-inset" />
          </div>
        </div>

        {!selectedClassId ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="calendar_today" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to record attendance</p>
          </div>
        ) : loadingStudents ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading...
          </div>
        ) : (
          <>
            {/* Days school opened */}
            <div className="ledger-card p-5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Days School Opened This Term *</label>
              <input
                type="number"
                min={1}
                max={200}
                value={daysOpened}
                onChange={(e) => { setDaysOpened(e.target.value === '' ? '' : Number(e.target.value)); setSaved(false); }}
                placeholder="e.g. 90"
                className="input-inset max-w-xs"
              />
              <p className="mt-2 text-xs text-on-surface-variant">This number applies to all students in the class</p>
            </div>

            {students.length === 0 ? (
              <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
                <Icon name="group" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No students in this class yet</p>
              </div>
            ) : (
              <div className="ledger-card overflow-hidden">
                <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">{students.length} students</span>
                  <span className="text-xs text-on-surface-variant">Enter number of days each student was present</span>
                </div>
                <div className="grid grid-cols-[2rem_1fr_1fr_8rem_6rem] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
                  <span />
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Student</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Admission No.</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Days Present</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Attendance %</span>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {students.map((student, idx) => {
                    const present = studentDays[student.id] ?? '';
                    const pct = daysOpened && present !== '' ? Math.round((Number(present) / Number(daysOpened)) * 100) : null;
                    return (
                      <div key={student.id} className="grid grid-cols-[2rem_1fr_1fr_8rem_6rem] gap-4 items-center px-6 py-3 hover:bg-surface-container-low/40 transition-colors">
                        <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">{idx + 1}</span>
                        <p className="font-bold text-on-surface text-sm">{student.lastName} {student.firstName}</p>
                        <p className="text-sm text-on-surface-variant">{student.admissionNumber}</p>
                        <input
                          type="number"
                          min={0}
                          max={Number(daysOpened) || 999}
                          value={present}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(Number(daysOpened) || 999, Math.max(0, Number(e.target.value)));
                            setStudentDays((prev) => ({ ...prev, [student.id]: val }));
                            setSaved(false);
                          }}
                          placeholder="0"
                          className="w-full bg-surface-container-highest border-none rounded-xl px-3 py-2 text-sm text-center font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                        />
                        <div className="text-center">
                          {pct !== null ? (
                            <span className={`text-sm font-bold ${pct >= 75 ? 'text-secondary' : pct >= 50 ? 'text-on-tertiary-container' : 'text-error'}`}>{pct}%</span>
                          ) : <span className="text-on-surface-variant/40 text-sm">—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving || daysOpened === ''}
                    className={`btn-primary text-sm flex items-center gap-2 disabled:opacity-60 ${saved ? 'from-secondary to-secondary bg-secondary' : ''}`}
                  >
                    {saving ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                      : saved ? <><Icon name="check" /> Saved!</>
                      : <><Icon name="save" /> Save Attendance</>}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
