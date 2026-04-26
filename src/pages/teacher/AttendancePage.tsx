import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDataStore } from '@/store/dataStore';
import { Term } from '@/types';

const CURRENT_TERM: Term = 'first';
const CURRENT_YEAR = '2024/2025';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const AttendancePage = () => {
  const { classes, getStudentsByClass, saveAttendance, getAttendance } = useDataStore();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [daysOpened, setDaysOpened] = useState<number | ''>('');
  const [studentDays, setStudentDays] = useState<Record<string, number | ''>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const students = getStudentsByClass(selectedClassId);

  useEffect(() => {
    if (!selectedClassId) return;
    const initial: Record<string, number | ''> = {};
    let opened: number | '' = '';
    students.forEach((s) => {
      const existing = getAttendance(s.id, selectedClassId, CURRENT_TERM, CURRENT_YEAR);
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
  }, [selectedClassId]);

  const handleSave = () => {
    if (!selectedClassId || daysOpened === '') return;
    setSaving(true);
    setTimeout(() => {
      students.forEach((s) => {
        saveAttendance({
          studentId: s.id,
          classId: selectedClassId,
          term: CURRENT_TERM,
          academicYear: CURRENT_YEAR,
          daysSchoolOpened: Number(daysOpened),
          daysPresent: studentDays[s.id] === '' ? 0 : Number(studentDays[s.id]),
        });
      });
      setSaving(false);
      setSaved(true);
    }, 400);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Attendance
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Record days school opened and each student's attendance — appears on result sheet
            </p>
          </div>
          {selectedClassId && students.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving || daysOpened === ''}
              className={`btn-primary text-sm flex items-center gap-2 disabled:opacity-60 ${
                saved ? 'from-secondary to-secondary bg-secondary' : ''
              }`}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <><Icon name="check" /> Saved</>
              ) : (
                <><Icon name="save" /> Save Attendance</>
              )}
            </button>
          )}
        </div>

        {/* Class selector */}
        <div className="ledger-card p-5">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Select Class
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
            <Icon name="calendar_today" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to record attendance</p>
          </div>
        ) : (
          <>
            {/* Days school opened */}
            <div className="ledger-card p-5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Total Days School Opened This Term *
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={daysOpened}
                onChange={(e) => {
                  setDaysOpened(e.target.value === '' ? '' : Number(e.target.value));
                  setSaved(false);
                }}
                placeholder="e.g. 90"
                className="input-inset max-w-xs"
              />
              <p className="mt-2 text-xs text-on-surface-variant">
                This number applies to all students in the class
              </p>
            </div>

            {/* Student attendance table */}
            {students.length === 0 ? (
              <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
                <Icon name="group" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No students in this class yet</p>
              </div>
            ) : (
              <div className="ledger-card overflow-hidden">
                <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">
                    {students.length} students
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Enter number of days each student was present
                  </span>
                </div>

                {/* Column headers */}
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
                    const pct =
                      daysOpened && present !== ''
                        ? Math.round((Number(present) / Number(daysOpened)) * 100)
                        : null;
                    return (
                      <div
                        key={student.id}
                        className="grid grid-cols-[2rem_1fr_1fr_8rem_6rem] gap-4 items-center px-6 py-3 hover:bg-surface-container-low/40 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                          {idx + 1}
                        </span>
                        <p className="font-bold text-on-surface text-sm">
                          {student.lastName} {student.firstName}
                        </p>
                        <p className="text-sm text-on-surface-variant">{student.admissionNumber}</p>
                        <input
                          type="number"
                          min={0}
                          max={Number(daysOpened) || 999}
                          value={present}
                          onChange={(e) => {
                            const val =
                              e.target.value === ''
                                ? ''
                                : Math.min(
                                    Number(daysOpened) || 999,
                                    Math.max(0, Number(e.target.value))
                                  );
                            setStudentDays((prev) => ({ ...prev, [student.id]: val }));
                            setSaved(false);
                          }}
                          placeholder="0"
                          className="w-full bg-surface-container-highest border-none rounded-xl px-3 py-2 text-sm text-center font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                        />
                        <div className="text-center">
                          {pct !== null ? (
                            <span className={`text-sm font-bold ${
                              pct >= 75 ? 'text-secondary'
                              : pct >= 50 ? 'text-on-tertiary-container'
                              : 'text-error'
                            }`}>
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/40 text-sm">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving || daysOpened === ''}
                    className={`btn-primary text-sm flex items-center gap-2 disabled:opacity-60 ${
                      saved ? 'from-secondary to-secondary bg-secondary' : ''
                    }`}
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <><Icon name="check" /> Saved!</>
                    ) : (
                      <><Icon name="save" /> Save Attendance</>
                    )}
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