import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Teacher, Class } from "@/types";

const Icon = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

export const TeachersPage = () => {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? "";

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      api.get<Teacher[]>(`/schools/${schoolId}/teachers`),
      api.get<Class[]>(`/schools/${schoolId}/classes`),
    ]).then(([tch, cls]) => {
      setTeachers(tch);
      setClasses(cls);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [schoolId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    const duplicate = teachers.find(
      (t) => t.email.toLowerCase() === form.email.trim().toLowerCase() && t.id !== editingId,
    );
    if (duplicate) e.email = "A teacher with this email already exists";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setSaving(true);
    setApiError(null);
    try {
      if (editingId) {
        const updated = await api.patch<Teacher>(`/schools/${schoolId}/teachers/${editingId}`, {
          status: editStatus,
        });
        setTeachers((prev) => prev.map((t) => t.id === editingId ? updated : t));
      } else {
        if (!validate()) { setSaving(false); return; }
        const created = await api.post<Teacher>(`/schools/${schoolId}/teachers/invite`, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        });
        setTeachers((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ firstName: "", lastName: "", email: "" });
      setErrors({});
    } catch (e: any) {
      setApiError(e.message ?? "Failed to save teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setEditStatus((teacher.status as "active" | "inactive") ?? "active");
    setShowForm(true);
    setErrors({});
    setApiError(null);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setApiError(null);
    try {
      await api.delete(`/schools/${schoolId}/teachers/${id}`);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
    } catch (e: any) {
      setApiError(e.message ?? "Failed to delete teacher");
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ firstName: "", lastName: "", email: "" });
    setErrors({});
    setApiError(null);
  };

  const editingTeacher = editingId ? teachers.find((t) => t.id === editingId) : null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32 text-on-surface-variant">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
          Loading teachers...
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
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Teachers</h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Add teachers here — they can then be assigned to classes
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm({ firstName: "", lastName: "", email: "" }); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="person_add" /> Add Teacher
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
              {editingId ? `Edit — ${editingTeacher?.firstName} ${editingTeacher?.lastName}` : "Invite New Teacher"}
            </h3>
            {editingId ? (
              /* Edit: only status */
              <div className="max-w-xs mb-5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "active" | "inactive")}
                  className="input-inset"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Name and email cannot be changed after invitation.
                </p>
              </div>
            ) : (
              /* Create: firstName, lastName, email */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    First Name *
                  </label>
                  <input
                    value={form.firstName}
                    onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrors({ ...errors, firstName: "" }); }}
                    placeholder="e.g. Folake"
                    className={`input-inset ${errors.firstName ? "ring-2 ring-error" : ""}`}
                  />
                  {errors.firstName && <p className="mt-1.5 text-xs text-error">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Last Name *
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrors({ ...errors, lastName: "" }); }}
                    placeholder="e.g. Adebayo"
                    className={`input-inset ${errors.lastName ? "ring-2 ring-error" : ""}`}
                  />
                  {errors.lastName && <p className="mt-1.5 text-xs text-error">{errors.lastName}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Email Address *
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                    placeholder="e.g. fadebayo@school.com"
                    className={`input-inset ${errors.email ? "ring-2 ring-error" : ""}`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-error">{errors.email}</p>}
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
                ) : editingId ? "Update Status" : "Invite Teacher"}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {teachers.length === 0 && !showForm ? (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="person_search" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">No teachers added yet</p>
            <p className="text-sm mt-1 mb-6">Add teachers so they can be assigned to classes</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Icon name="person_add" className="mr-1" /> Add First Teacher
            </button>
          </div>
        ) : teachers.length > 0 && (
          <div className="ledger-card overflow-hidden">
            <div className="px-4 md:px-6 py-4 bg-surface-container-low border-b border-outline-variant/10">
              <span className="text-sm font-bold text-on-surface">
                {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} registered
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[2.5rem_1.5fr_1fr_auto_auto] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
                <span />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Name</span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Email</span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</span>
                <span />
              </div>
              <div className="divide-y divide-outline-variant/10">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="grid grid-cols-[2.5rem_1fr_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
                      {teacher.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{teacher.firstName} {teacher.lastName}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {classes.filter((c) => c.teacherId === teacher.id).length === 0 ? (
                          <span className="text-xs text-on-surface-variant/50 italic">No class assigned</span>
                        ) : (
                          classes.filter((c) => c.teacherId === teacher.id).map((c) => (
                            <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-full">{c.name}</span>
                          ))
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-on-surface-variant">{teacher.email}</p>
                    <span className="badge-validated text-[10px]">{teacher.status}</span>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(teacher)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors">
                        <Icon name="edit" className="text-base" />
                      </button>
                      {deleteConfirmId === teacher.id ? (
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            disabled={deleting === teacher.id}
                            className="px-2 py-1 text-xs bg-error text-on-error rounded-lg disabled:opacity-50"
                          >
                            {deleting === teacher.id ? "..." : "Confirm"}
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs border border-outline-variant/30 rounded-lg">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(teacher.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors">
                          <Icon name="delete" className="text-base" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-outline-variant/10">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold flex-shrink-0">
                      {teacher.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-on-surface">{teacher.firstName} {teacher.lastName}</p>
                        <span className="badge-validated text-[10px]">{teacher.status}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-0.5 break-all">{teacher.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {classes.filter((c) => c.teacherId === teacher.id).length === 0 ? (
                          <span className="text-xs text-on-surface-variant/50 italic">No class assigned</span>
                        ) : (
                          classes.filter((c) => c.teacherId === teacher.id).map((c) => (
                            <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-full">{c.name}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {deleteConfirmId === teacher.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        disabled={deleting === teacher.id}
                        className="flex-1 py-2.5 text-sm bg-error text-on-error rounded-xl font-bold disabled:opacity-50"
                      >
                        {deleting === teacher.id ? "Deleting..." : "Confirm Delete"}
                      </button>
                      <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm border border-outline-variant/30 rounded-xl font-bold text-on-surface-variant">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(teacher)} className="flex-1 py-2.5 text-sm border border-outline-variant/30 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center gap-2 transition-colors">
                        <Icon name="edit" className="text-base" /> Edit
                      </button>
                      <button onClick={() => setDeleteConfirmId(teacher.id)} className="flex-1 py-2.5 text-sm border border-error/30 text-error rounded-xl font-bold hover:bg-error-container/20 flex items-center justify-center gap-2 transition-colors">
                        <Icon name="delete" className="text-base" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 md:px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm({ firstName: "", lastName: "", email: "" }); }}
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Icon name="person_add" className="text-base" /> Add another teacher
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
