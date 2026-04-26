import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDataStore, Student } from '@/store/dataStore';

const emptyForm = {
  admissionNumber: '',
  firstName: '',
  lastName: '',
  middleName: '',
  gender: 'male' as 'male' | 'female',
  dateOfBirth: '',
  parentName: '',
  parentPhone: '',
};

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const StudentsPage = () => {
  const { classes, addStudent, updateStudent, deleteStudent, getStudentsByClass } = useDataStore();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const classStudents = getStudentsByClass(selectedClassId);
  const filtered = classStudents.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.admissionNumber}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.admissionNumber.trim()) e.admissionNumber = 'Admission number is required';
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!selectedClassId) e.class = 'Please select a class first';
    const duplicate = classStudents.find(
      (s) => s.admissionNumber.toLowerCase() === form.admissionNumber.trim().toLowerCase() && s.id !== editingId
    );
    if (duplicate) e.admissionNumber = 'This admission number already exists in this class';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        updateStudent(editingId, {
          admissionNumber: form.admissionNumber.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || undefined,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth || undefined,
          parentName: form.parentName.trim() || undefined,
          parentPhone: form.parentPhone.trim() || undefined,
        });
      } else {
        addStudent({
          id: `student_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          classId: selectedClassId,
          admissionNumber: form.admissionNumber.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || undefined,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth || undefined,
          parentName: form.parentName.trim() || undefined,
          parentPhone: form.parentPhone.trim() || undefined,
        });
      }
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setErrors({});
    }, 300);
  };

  const handleEdit = (student: Student) => {
    setForm({
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName ?? '',
      gender: student.gender,
      dateOfBirth: student.dateOfBirth ?? '',
      parentName: student.parentName ?? '',
      parentPhone: student.parentPhone ?? '',
    });
    setEditingId(student.id);
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
              Students
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Manage students per class
            </p>
          </div>
          {selectedClassId && !showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="person_add" />
              Add Student
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
            onChange={(e) => { setSelectedClassId(e.target.value); setShowForm(false); setSearch(''); }}
            className="input-inset"
          >
            <option value="">— Choose a class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({getStudentsByClass(c.id).length} students)
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
              {editingId ? 'Edit Student' : 'Add New Student'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Admission Number *
                </label>
                <input
                  value={form.admissionNumber}
                  onChange={(e) => { setForm({ ...form, admissionNumber: e.target.value }); setErrors({ ...errors, admissionNumber: '' }); }}
                  placeholder="e.g. JSS1A/001"
                  className={`input-inset ${errors.admissionNumber ? 'ring-2 ring-error' : ''}`}
                />
                {errors.admissionNumber && <p className="mt-1.5 text-xs text-error">{errors.admissionNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Gender *
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                  className="input-inset"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  First Name *
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrors({ ...errors, firstName: '' }); }}
                  placeholder="e.g. Oluwaseun"
                  className={`input-inset ${errors.firstName ? 'ring-2 ring-error' : ''}`}
                />
                {errors.firstName && <p className="mt-1.5 text-xs text-error">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Last Name *
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrors({ ...errors, lastName: '' }); }}
                  placeholder="e.g. Adeyemi"
                  className={`input-inset ${errors.lastName ? 'ring-2 ring-error' : ''}`}
                />
                {errors.lastName && <p className="mt-1.5 text-xs text-error">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Middle Name <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={form.middleName}
                  onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                  placeholder="e.g. Chukwuemeka"
                  className="input-inset"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Date of Birth <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="input-inset"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Parent/Guardian Name <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  placeholder="e.g. Mr. Adeyemi Tunde"
                  className="input-inset"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Parent Phone <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="e.g. 08012345678"
                  className="input-inset"
                />
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
                  <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</>
                ) : editingId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        )}

        {/* Students list */}
        {selectedClassId && !showForm && (
          <>
            {classStudents.length === 0 ? (
              <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
                <Icon name="group" className="text-5xl text-outline/30 mb-4" />
                <p className="font-headline font-bold text-lg">No students yet</p>
                <p className="text-sm mt-1 mb-6">Add the first student to this class</p>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                  <Icon name="person_add" className="mr-2" /> Add First Student
                </button>
              </div>
            ) : (
              <div className="ledger-card overflow-hidden">
                {/* Table header */}
                <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-on-surface">
                    {classStudents.length} student{classStudents.length !== 1 ? 's' : ''} in{' '}
                    {classes.find((c) => c.id === selectedClassId)?.name}
                  </span>
                  <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5 w-56">
                    <Icon name="search" className="text-on-surface-variant/60 text-base" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="bg-transparent text-sm outline-none w-full text-on-surface placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[2rem_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                  <span />
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Name</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Admission No.</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest hidden md:block">Parent</span>
                  <span />
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {filtered.map((student, idx) => (
                    <div key={student.id} className="grid grid-cols-[2rem_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
                      <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-on-surface text-sm">
                          {student.lastName} {student.firstName}
                          {student.middleName ? ` ${student.middleName}` : ''}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {student.gender === 'male' ? '♂' : '♀'} {student.gender}
                        </p>
                      </div>
                      <p className="text-sm text-on-surface-variant font-medium">
                        {student.admissionNumber}
                      </p>
                      <p className="text-sm text-on-surface-variant hidden md:block">
                        {student.parentName ?? '—'}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icon name="edit" className="text-base" />
                        </button>
                        {deleteConfirmId === student.id ? (
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => { deleteStudent(student.id); setDeleteConfirmId(null); }}
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
                            onClick={() => setDeleteConfirmId(student.id)}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Icon name="delete" className="text-base" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                  <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Icon name="person_add" className="text-base" /> Add another student
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* No class selected */}
        {!selectedClassId && (
          <div className="ledger-card flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Icon name="group" className="text-5xl text-outline/30 mb-4" />
            <p className="font-headline font-bold text-lg">Select a class to manage students</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;