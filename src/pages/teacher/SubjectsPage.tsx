import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDataStore, Subject } from '@/store/dataStore';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SubjectsPage = () => {
  const { classes, addSubject, updateSubject, deleteSubject, getSubjectsByClass } = useDataStore();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const classSubjects = getSubjectsByClass(selectedClassId);

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

  const unusedSuggestions = SUGGESTIONS.filter(
    (s) => !classSubjects.find((cs) => cs.name.toLowerCase() === s.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Subject name is required';
    if (!selectedClassId) e.class = 'Please select a class first';
    const duplicate = classSubjects.find(
      (s) => s.name.toLowerCase() === form.name.trim().toLowerCase() && s.id !== editingId
    );
    if (duplicate) e.name = 'This subject already exists in this class';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        updateSubject(editingId, {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase() || undefined,
        });
      } else {
        addSubject({
          id: `subject_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          classId: selectedClassId,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase() || undefined,
        });
      }
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', code: '' });
      setErrors({});
    }, 300);
  };

  const handleEdit = (subject: Subject) => {
    setForm({ name: subject.name, code: subject.code ?? '' });
    setEditingId(subject.id);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', code: '' });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Subjects
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Add subjects per class — they appear in Score Entry automatically
            </p>
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

        {/* Class selector */}
        <div className="ledger-card p-5">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setShowForm(false); }}
            className="input-inset"
          >
            <option value="">— Choose a class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({getSubjectsByClass(c.id).length} subjects)
              </option>
            ))}
          </select>
          {classes.length === 0 && (
            <p className="mt-2 text-xs text-on-tertiary-container">
              No classes yet — ask your principal to create classes first
            </p>
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
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Subject Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. Mathematics"
                  className={`input-inset ${errors.name ? 'ring-2 ring-error' : ''}`}
                />
                {errors.name && <p className="mt-1.5 text-xs text-error">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Subject Code <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. MTH"
                  className="input-inset"
                  maxLength={6}
                />
                <p className="mt-1.5 text-xs text-on-surface-variant">Shown on result sheet</p>
              </div>
            </div>

            {/* Quick suggestions */}
            {!editingId && unusedSuggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Quick add
                </p>
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
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                ) : editingId ? 'Update Subject' : 'Add Subject'}
              </button>
            </div>
          </div>
        )}

        {/* Subjects list */}
        {selectedClassId && !showForm && (
          <>
            {classSubjects.length === 0 ? (
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
                    {classSubjects.length} subject{classSubjects.length !== 1 ? 's' : ''} in{' '}
                    {classes.find((c) => c.id === selectedClassId)?.name}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    CA1 (20) + CA2 (20) + Exam (60) = 100
                  </span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                  <span />
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Subject</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Code</span>
                  <span />
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {classSubjects.map((subject, idx) => (
                    <div key={subject.id} className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
                      <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                        {idx + 1}
                      </span>
                      <p className="font-bold text-on-surface text-sm">{subject.name}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        subject.code
                          ? 'bg-primary/5 text-primary'
                          : 'text-on-surface-variant/40'
                      }`}>
                        {subject.code ?? '—'}
                      </span>
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                        >
                          <Icon name="edit" className="text-base" />
                        </button>
                        {deleteConfirmId === subject.id ? (
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => { deleteSubject(subject.id); setDeleteConfirmId(null); }}
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
                            onClick={() => setDeleteConfirmId(subject.id)}
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