import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Class, Subject } from '@/types';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const SUGGESTIONS = [
  'Mathematics', 'English Language', 'Basic Science', 'Basic Technology',
  'Civic Education', 'Computer Studies', 'Agricultural Science',
  'Physical & Health Education', 'Cultural & Creative Arts',
  'Business Studies', 'Home Economics', 'French', 'Yoruba Language',
  'Igbo Language', 'Hausa Language', 'Social Studies',
  'Christian Religious Studies', 'Islamic Religious Studies',
  'Economics', 'Government', 'Literature in English',
  'Biology', 'Chemistry', 'Physics', 'Geography', 'History',
  'Financial Accounting', 'Commerce', 'Further Mathematics',
];

export const SubjectsPage = () => {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    api.get<Class[]>(`/schools/${schoolId}/classes`)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClassId || !schoolId) { setSubjects([]); return; }
    setLoadingSubjects(true);
    api.get<Subject[]>(`/schools/${schoolId}/classes/${selectedClassId}/subjects`)
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }, [selectedClassId, schoolId]);

  const unusedSuggestions = SUGGESTIONS.filter(
    (s) => !subjects.find((cs) => cs.name.toLowerCase() === s.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Subject name is required';
    if (!selectedClassId) e.class = 'Please select a class first';
    const duplicate = subjects.find(
      (s) => s.name.toLowerCase() === form.name.trim().toLowerCase() && s.id !== editingId
    );
    if (duplicate) e.name = 'This subject already exists in this class';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase() || undefined,
    };
    try {
      if (editingId) {
        const updated = await api.patch<Subject>(
          `/schools/${schoolId}/classes/${selectedClassId}/subjects/${editingId}`, payload
        );
        setSubjects((prev) => prev.map((s) => s.id === editingId ? updated : s));
      } else {
        const created = await api.post<Subject>(
          `/schools/${schoolId}/classes/${selectedClassId}/subjects`, payload
        );
        setSubjects((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', code: '' });
      setErrors({});
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setForm({ name: subject.name, code: subject.code ?? '' });
    setEditingId(subject.id);
    setShowForm(true);
    setErrors({});
    setApiError(null);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setApiError(null);
    try {
      await api.delete(`/schools/${schoolId}/classes/${selectedClassId}/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to delete subject');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', code: '' });
    setErrors({});
    setApiError(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Subjects</h2>
            <p className="text-on-surface-variant text-sm mt-1">Add subjects per class — they appear in Score Entry automatically</p>
          </div>
          {selectedClassId && !showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '' }); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="add" /> Add Subject
            </button>
          )}
        </div>

        {apiError && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{apiError}</div>
        )}

        {/* Class selector */}
        <div className="ledger-card p-5">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Select Class</label>
          {loadingClasses ? (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Loading classes...
            </div>
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setShowForm(false); setApiError(null); }}
              className="input-inset"
            >
              <option value="">— Choose a class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {classes.length === 0 && !loadingClasses && (
            <p className="mt-2 text-xs text-on-tertiary-container">No classes yet — ask your principal to create classes first</p>
          )}
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="ledger-card p-6">
            <h3 className="font-headline font-bold text-lg text-primary mb-5">
              {editingId ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Subject Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. Mathematics"
                  className={`input-inset ${errors.name ? 'ring-2 ring-error' : ''}`}
                />
                {errors.name && <p className="mt-1.5 text-xs text-error">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Subject Code <span className="normal-case font-normal">(optional)</span></label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MTH" className="input-inset" maxLength={6} />
                <p className="mt-1.5 text-xs text-on-surface-variant">Shown on result sheet</p>
              </div>
            </div>

            {!editingId && unusedSuggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {unusedSuggestions.slice(0, 12).map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm({ ...form, name: s })}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        form.name === s
                          ? 'border-primary bg-primary/5 text-primary font-bold'
                          : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary'
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
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</> : editingId ? 'Update Subject' : 'Add Subject'}
              </button>
            </div>
          </div>
        )}

        {/* Subjects list */}
        {selectedClassId && !showForm && (
          <>
            {loadingSubjects ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
                <Icon name="book" className="text-5xl text-outline/30 mb-4" />
                <p className="font-headline font-bold text-lg">No subjects yet</p>
                <p className="text-sm mt-1 mb-6">Add the first subject for this class</p>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                  <Icon name="add" className="mr-1" /> Add First Subject
                </button>
              </div>
            ) : (
              <div className="ledger-card overflow-hidden">
                <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">
                    {subjects.length} subject{subjects.length !== 1 ? 's' : ''} in {classes.find((c) => c.id === selectedClassId)?.name}
                  </span>
                  <span className="text-xs text-on-surface-variant">CA1 (20) + CA2 (20) + Exam (60) = 100</span>
                </div>
                <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                  <span />
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Subject</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Code</span>
                  <span />
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {subjects.map((subject, idx) => (
                    <div key={subject.id} className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
                      <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">{idx + 1}</span>
                      <p className="font-bold text-on-surface text-sm">{subject.name}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${subject.code ? 'bg-primary/5 text-primary' : 'text-on-surface-variant/40'}`}>
                        {subject.code ?? '—'}
                      </span>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(subject)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"><Icon name="edit" className="text-base" /></button>
                        {deleteConfirmId === subject.id ? (
                          <div className="flex gap-1 items-center">
                            <button onClick={() => handleDelete(subject.id)} disabled={deleting === subject.id} className="px-2 py-1 text-xs bg-error text-on-error rounded-lg disabled:opacity-50">{deleting === subject.id ? '...' : 'Confirm'}</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs border border-outline-variant/30 rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(subject.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"><Icon name="delete" className="text-base" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                  <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '' }); }}
                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Icon name="add" className="text-base" /> Add another subject
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedClassId && (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="book" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to manage subjects</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
