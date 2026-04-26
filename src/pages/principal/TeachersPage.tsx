import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDataStore, TeacherRecord } from "@/store/dataStore";

const Icon = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

export const TeachersPage = () => {
  const { teachers, classes, addTeacher, updateTeacher, deleteTeacher } =
    useDataStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Teacher name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    const duplicate = teachers.find(
      (t) =>
        t.email.toLowerCase() === form.email.trim().toLowerCase() &&
        t.id !== editingId,
    );
    if (duplicate) e.email = "A teacher with this email already exists";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        updateTeacher(editingId, {
          name: form.name.trim(),
          email: form.email.trim(),
        });
      } else {
        addTeacher({
          id: `teacher_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: form.name.trim(),
          email: form.email.trim(),
          status: "active",
          invitedAt: new Date().toISOString().split("T")[0],
        });
      }
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", email: "" });
      setErrors({});
    }, 300);
  };

  const handleEdit = (teacher: TeacherRecord) => {
    setForm({ name: teacher.name, email: teacher.email });
    setEditingId(teacher.id);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", email: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Teachers
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Add teachers here — they can then be assigned to classes
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm({ name: "", email: "" });
              }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="person_add" /> Add Teacher
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="ledger-card p-6">
            <h3 className="font-headline font-bold text-lg text-primary mb-5">
              {editingId ? "Edit Teacher" : "Add New Teacher"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Full Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors({ ...errors, name: "" });
                  }}
                  placeholder="e.g. Mrs. Adebayo Folake"
                  className={`input-inset ${errors.name ? "ring-2 ring-error" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-error">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Email Address *
                </label>
                <input
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setErrors({ ...errors, email: "" });
                  }}
                  placeholder="e.g. fadebayo@school.com"
                  className={`input-inset ${errors.email ? "ring-2 ring-error" : ""}`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-error">{errors.email}</p>
                )}
              </div>
            </div>
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
                  "Update Teacher"
                ) : (
                  "Add Teacher"
                )}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {teachers.length === 0 && !showForm ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon
              name="person_search"
              className="text-5xl text-outline/30 mb-4"
            />
            <p className="font-headline font-bold text-lg">
              No teachers added yet
            </p>
            <p className="text-sm mt-1 mb-6">
              Add teachers so they can be assigned to classes
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm"
            >
              <Icon name="person_add" className="mr-1" /> Add First Teacher
            </button>
          </div>
        ) : (
          teachers.length > 0 && (
            <div className="ledger-card overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/10">
                <span className="text-sm font-bold text-on-surface">
                  {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}{" "}
                  registered
                </span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[2.5rem_1.5fr_1fr_auto_auto] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
                <span />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Name
                </span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Email
                </span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Status
                </span>
                <span />
              </div>

              <div className="divide-y divide-outline-variant/10">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="grid grid-cols-[2.5rem_1fr_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">
                        {teacher.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {classes.filter((c) => c.teacherId === teacher.id)
                          .length === 0 ? (
                          <span className="text-xs text-on-surface-variant/50 italic">
                            No class assigned
                          </span>
                        ) : (
                          classes
                            .filter((c) => c.teacherId === teacher.id)
                            .map((c) => (
                              <span
                                key={c.id}
                                className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-full"
                              >
                                {c.name}
                              </span>
                            ))
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {teacher.email}
                    </p>
                    <span className="badge-validated text-[10px]">
                      {teacher.status}
                    </span>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <Icon name="edit" className="text-base" />
                      </button>
                      {deleteConfirmId === teacher.id ? (
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => {
                              deleteTeacher(teacher.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 text-xs bg-error text-on-error rounded-lg"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs border border-outline-variant/30 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(teacher.id)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
                        >
                          <Icon name="delete" className="text-base" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setForm({ name: "", email: "" });
                  }}
                  className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Icon name="person_add" className="text-base" /> Add another
                  teacher
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
};
