import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Class, Teacher } from "@/types";
import { getCurrentAcademicYear, getAcademicYearOptions } from '@/components/ui/TermSelector';

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const getEmptyForm = () => ({
  name: "",
  academicYear: getCurrentAcademicYear(),
  teacherId: "",
  teacherName: "",
});

const SUGGESTIONS = [
  "Nursery 1","Nursery 2","Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6",
  "JSS 1A","JSS 1B","JSS 1C","JSS 2A","JSS 2B","JSS 2C","JSS 3A","JSS 3B","JSS 3C",
  "SS 1 Science","SS 1 Arts","SS 1 Commercial","SS 2 Science","SS 2 Arts","SS 2 Commercial",
  "SS 3 Science","SS 3 Arts","SS 3 Commercial",
];

export const ClassesPage = () => {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? "";

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => getEmptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    Promise.all([
      api.get<Class[]>(`/schools/${schoolId}/classes`),
      api.get<Teacher[]>(`/schools/${schoolId}/teachers`),
    ]).then(([cls, tch]) => {
      setClasses(cls);
      setTeachers(tch);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTeacherDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const unusedSuggestions = SUGGESTIONS.filter(
    (s) => !classes.find((c) => c.name.toLowerCase() === s.toLowerCase()),
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Class name is required";
    if (!form.academicYear.trim()) e.academicYear = "Academic year is required";
    else if (!/^\d{4}\/\d{4}$/.test(form.academicYear.trim()))
      e.academicYear = "Format must be YYYY/YYYY e.g. 2024/2025";
    const duplicate = classes.find(
      (c) => c.name.toLowerCase() === form.name.trim().toLowerCase() && c.id !== editingId,
    );
    if (duplicate) e.name = `A class named "${form.name.trim()}" already exists.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // selectedTeacher is looked up purely by teacher.id — simple and reliable
  const selectedTeacher = teachers.find((t) => t.id === form.teacherId);

  const handleTeacherSelect = (teacher: Teacher | null) => {
    console.log("SELECTED TEACHER:", teacher); // ADD THIS LOG
    if (!teacher) {
      setForm({ ...form, teacherId: "", teacherName: "" });
    } else {
      setForm({
        ...form,
        teacherId: teacher.id, // always use teacher.id — always present
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
      });
    }
    setTeacherDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      if (editingId) {
        // When saving, send teacher.userId to the backend (what the backend expects)
        const resolvedUserId = selectedTeacher?.userId || form.teacherId || null;
        const patchBody: Record<string, unknown> = {
          name: form.name.trim(),
          academicYear: form.academicYear.trim(),
          teacherId: resolvedUserId,
          teacherName: form.teacherName || null,
        };
        const updated = await api.patch<Class>(`/schools/${schoolId}/classes/${editingId}`, patchBody);
        setClasses((prev) => prev.map((c) => c.id === editingId ? updated : c));
      } else {
        const resolvedUserId = selectedTeacher?.userId || form.teacherId || undefined;
        const created = await api.post<Class>(`/schools/${schoolId}/classes`, {
          name: form.name.trim(),
          academicYear: form.academicYear.trim(),
          teacherId: resolvedUserId,
          teacherName: form.teacherName || undefined,
        });
        setClasses((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(getEmptyForm());
      setErrors({});
    } catch (e: any) {
      setApiError(e.message ?? "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: Class) => {
    // Find teacher by userId (what backend stores on the class)
    const matchedTeacher = teachers.find((t) => t.userId === cls.teacherId);
    setForm({
      name: cls.name,
      academicYear: cls.academicYear,
      // Store teacher.id for UI matching, resolve to userId on save
      teacherId: matchedTeacher?.id ?? "",
      teacherName: cls.teacherName ?? "",
    });
    setEditingId(cls.id);
    setShowForm(true);
    setErrors({});
    setApiError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
    setErrors({});
    setApiError(null);
    setTeacherDropdownOpen(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32 text-on-surface-variant">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
          Loading classes...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Classes</h2>
            <p className="text-on-surface-variant text-sm mt-1">Create classes and assign teachers to them</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(getEmptyForm()); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="add" /> Create Class
            </button>
          )}
        </div>

        {apiError && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>
        )}

        {/* Form */}
        {showForm && (
          <div className="ledger-card p-6">
            <h3 className="font-headline font-bold text-lg text-primary mb-5">
              {editingId ? "Edit Class" : "Create New Class"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Class Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                  placeholder="e.g. JSS 1A, SS 2 Science"
                  className={`input-inset ${errors.name ? "ring-2 ring-error" : ""}`}
                />
                {errors.name && <p className="mt-1.5 text-xs text-error">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Academic Year *
                </label>
                <select
                  value={form.academicYear}
                  onChange={(e) => { setForm({ ...form, academicYear: e.target.value }); setErrors({ ...errors, academicYear: "" }); }}
                  className={`input-inset ${errors.academicYear ? "ring-2 ring-error" : ""}`}
                >
                  {getAcademicYearOptions(5).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.academicYear && <p className="mt-1.5 text-xs text-error">{errors.academicYear}</p>}
              </div>

              {/* Custom teacher picker */}
              <div className="md:col-span-2" ref={dropdownRef}>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Assign Teacher <span className="normal-case font-normal">(optional)</span>
                </label>

                {teachers.length === 0 ? (
                  <div className="input-inset text-on-tertiary-container bg-tertiary-fixed/20">
                    ⚠ No teachers added yet — go to Teachers page first
                  </div>
                ) : (
                  <div className="relative">
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => setTeacherDropdownOpen((o) => !o)}
                      className={`w-full input-inset flex items-center justify-between gap-3 text-left transition-all ${
                        teacherDropdownOpen ? "ring-2 ring-primary" : ""
                      } ${selectedTeacher ? "border-primary/40 bg-primary/5" : ""}`}
                    >
                      {selectedTeacher ? (
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {selectedTeacher.firstName[0]}{selectedTeacher.lastName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-on-surface text-sm truncate">
                              {selectedTeacher.firstName} {selectedTeacher.lastName}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">{selectedTeacher.email}</p>
                          </div>
                          <Icon name="check_circle" className="text-primary text-lg flex-shrink-0" />
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/60 text-sm flex-1">— Tap to assign a teacher —</span>
                      )}
                      <Icon name={teacherDropdownOpen ? "expand_less" : "expand_more"} className="text-on-surface-variant flex-shrink-0" />
                    </button>

                    {/* Dropdown list */}
                    {teacherDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface rounded-xl shadow-ambient border border-outline-variant/20 overflow-hidden">
                        {/* Clear option */}
                        <button
                          type="button"
                          onClick={() => handleTeacherSelect(null)}
                          className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-container transition-colors ${
                            !form.teacherId ? "bg-surface-container" : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-outline-variant/40 flex items-center justify-center flex-shrink-0">
                            <Icon name="remove" className="text-on-surface-variant/50 text-base" />
                          </div>
                          <span className="text-sm text-on-surface-variant italic flex-1">No teacher assigned</span>
                          {!form.teacherId && (
                            <Icon name="check" className="text-primary text-base" />
                          )}
                        </button>

                        <div className="border-t border-outline-variant/10" />

                        {/* Teacher options */}
                        {teachers.map((t) => {
                          const isSelected = form.teacherId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleTeacherSelect(t)}
                              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                                isSelected
                                  ? "bg-primary/10 hover:bg-primary/15"
                                  : "hover:bg-surface-container"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected
                                  ? "bg-primary text-on-primary"
                                  : "bg-surface-container-highest text-on-surface-variant"
                              }`}>
                                {t.firstName[0]}{t.lastName[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-bold text-sm truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                                  {t.firstName} {t.lastName}
                                </p>
                                <p className="text-xs text-on-surface-variant truncate">{t.email}</p>
                              </div>
                              {isSelected && (
                                <Icon name="check_circle" className="text-primary text-lg flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick suggestions */}
            {!editingId && unusedSuggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Quick create</p>
                <div className="flex flex-wrap gap-2">
                  {unusedSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setForm({ ...form, name: s }); setErrors({ ...errors, name: "" }); }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        form.name === s
                          ? "border-primary bg-primary/5 text-primary font-bold"
                          : "border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleCancel} className="btn-ghost text-sm">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                ) : editingId ? "Update Class" : "Create Class"}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        {classes.length > 4 && (
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-full px-4 py-2.5 w-full sm:w-72 shadow-card">
            <Icon name="search" className="text-on-surface-variant/60 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes..."
              className="bg-transparent text-sm outline-none w-full text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>
        )}

        {/* Grid */}
        {classes.length === 0 ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="school" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">No classes created yet</p>
            <p className="text-sm mt-1 mb-6">Create your first class to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Icon name="add" className="mr-1" /> Create First Class
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <p className="font-headline font-bold text-lg">No classes match "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cls) => (
              <div key={cls.id} className="ledger-card p-5 hover:shadow-ambient transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-primary">{cls.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{cls.academicYear}</p>
                  </div>
                  <span className="p-2 bg-primary/5 text-primary rounded-xl">
                    <Icon name="school" />
                  </span>
                </div>
                {cls.teacherName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="check_circle" className="text-secondary text-base flex-shrink-0" />
                    <span className="text-sm text-on-surface font-medium">{cls.teacherName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="warning" className="text-on-tertiary-container text-base flex-shrink-0" />
                    <span className="text-sm text-on-surface-variant">No teacher assigned</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="group" className="text-on-surface-variant text-base flex-shrink-0" />
                  <span className="text-sm text-on-surface-variant">
                    {(cls as any).studentCount ?? 0} student{((cls as any).studentCount ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => handleEdit(cls)}
                  className="w-full py-3 text-sm border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant font-bold flex items-center justify-center gap-2"
                >
                  <Icon name="edit" className="text-base" /> Edit Class
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer summary */}
        {classes.length > 0 && (
          <div className="ledger-card p-4 flex items-center justify-between text-sm">
            <span className="text-on-surface-variant">
              Total: <span className="font-bold text-on-surface">{classes.length}</span> class{classes.length !== 1 ? "es" : ""}
            </span>
            <span className="text-on-surface-variant">
              <span className="font-bold text-secondary">{classes.filter((c) => c.teacherName).length}</span> of {classes.length} have teachers assigned
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};