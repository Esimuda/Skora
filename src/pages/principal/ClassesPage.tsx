import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDataStore, ClassItem } from "@/store/dataStore";

const Icon = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

const emptyForm = {
  name: "",
  academicYear: "2024/2025",
  teacherId: "",
  teacherName: "",
};

export const ClassesPage = () => {
  const { classes, teachers, addClass, updateClass, getStudentsByClass } =
    useDataStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const SUGGESTIONS = [
    "Nursery 1",
    "Nursery 2",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JSS 1A",
    "JSS 1B",
    "JSS 1C",
    "JSS 2A",
    "JSS 2B",
    "JSS 2C",
    "JSS 3A",
    "JSS 3B",
    "JSS 3C",
    "SS 1 Science",
    "SS 1 Arts",
    "SS 1 Commercial",
    "SS 2 Science",
    "SS 2 Arts",
    "SS 2 Commercial",
    "SS 3 Science",
    "SS 3 Arts",
    "SS 3 Commercial",
  ];
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
      (c) =>
        c.name.toLowerCase() === form.name.trim().toLowerCase() &&
        c.id !== editingId,
    );
    if (duplicate)
      e.name = `A class named "${form.name.trim()}" already exists.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setForm({ ...form, teacherId, teacherName: teacher ? teacher.name : "" });
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        updateClass(editingId, {
          name: form.name.trim(),
          academicYear: form.academicYear.trim(),
          teacherId: form.teacherId || undefined,
          teacherName: form.teacherName || undefined,
        });
      } else {
        addClass({
          id: `class_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: form.name.trim(),
          academicYear: form.academicYear.trim(),
          teacherId: form.teacherId || undefined,
          teacherName: form.teacherName || undefined,
        });
      }
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setErrors({});
    }, 400);
  };

  const handleEdit = (cls: ClassItem) => {
    setForm({
      name: cls.name,
      academicYear: cls.academicYear,
      teacherId: cls.teacherId ?? "",
      teacherName: cls.teacherName ?? "",
    });
    setEditingId(cls.id);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Classes
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Create classes and assign teachers to them
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm({ ...emptyForm });
              }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="add" /> Create Class
            </button>
          )}
        </div>

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
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors({ ...errors, name: "" });
                  }}
                  placeholder="e.g. JSS 1A, SS 2 Science"
                  className={`input-inset ${errors.name ? "ring-2 ring-error" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-error">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Academic Year *
                </label>
                <input
                  value={form.academicYear}
                  onChange={(e) => {
                    setForm({ ...form, academicYear: e.target.value });
                    setErrors({ ...errors, academicYear: "" });
                  }}
                  placeholder="e.g. 2024/2025"
                  className={`input-inset ${errors.academicYear ? "ring-2 ring-error" : ""}`}
                />
                {errors.academicYear && (
                  <p className="mt-1.5 text-xs text-error">
                    {errors.academicYear}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Assign Teacher{" "}
                  <span className="normal-case font-normal">(optional)</span>
                </label>
                {teachers.length === 0 ? (
                  <div className="input-inset text-on-tertiary-container bg-tertiary-fixed/20">
                    ⚠ No teachers added yet — go to Teachers page first
                  </div>
                ) : (
                  <select
                    value={form.teacherId}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    className="input-inset"
                  >
                    <option value="">— No teacher assigned —</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Quick suggestions */}
            {!editingId && unusedSuggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Quick create
                </p>
                <div className="flex flex-wrap gap-2">
                  {unusedSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setForm({ ...form, name: s });
                        setErrors({ ...errors, name: "" });
                      }}
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
              <button onClick={handleCancel} className="btn-ghost text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />{" "}
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Class"
                ) : (
                  "Create Class"
                )}
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
            <p className="font-headline font-bold text-lg">
              No classes created yet
            </p>
            <p className="text-sm mt-1 mb-6">
              Create your first class to get started
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm"
            >
              <Icon name="add" className="mr-1" /> Create First Class
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ledger-card flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <p className="font-headline font-bold text-lg">
              No classes match "{search}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cls) => (
              <div
                key={cls.id}
                className="ledger-card p-5 hover:shadow-ambient transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-primary">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {cls.academicYear}
                    </p>
                  </div>
                  <span className="p-2 bg-primary/5 text-primary rounded-xl">
                    <Icon name="school" />
                  </span>
                </div>
                {cls.teacherName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      name="check_circle"
                      className="text-secondary text-base flex-shrink-0"
                    />
                    <span className="text-sm text-on-surface font-medium">
                      {cls.teacherName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      name="warning"
                      className="text-on-tertiary-container text-base flex-shrink-0"
                    />
                    <span className="text-sm text-on-surface-variant">
                      No teacher assigned
                    </span>
                  </div>
                )}

                {/* Student count */}
                <div className="flex items-center gap-2 mb-4">
                  <Icon
                    name="group"
                    className="text-on-surface-variant text-base flex-shrink-0"
                  />
                  <span className="text-sm text-on-surface-variant">
                    {getStudentsByClass(cls.id).length} student
                    {getStudentsByClass(cls.id).length !== 1 ? "s" : ""}
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
              Total:{" "}
              <span className="font-bold text-on-surface">
                {classes.length}
              </span>{" "}
              class{classes.length !== 1 ? "es" : ""}
            </span>
            <span className="text-on-surface-variant">
              <span className="font-bold text-secondary">
                {classes.filter((c) => c.teacherName).length}
              </span>{" "}
              of {classes.length} have teachers assigned
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
