import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useTeacherClasses } from '@/lib/useTeacherClasses';
import { Student } from '@/types';

const emptyForm = {
  admissionNumber: '',
  firstName: '',
  lastName: '',
  middleName: '',
  gender: 'male' as 'male' | 'female',
  dateOfBirth: '',
  parentName: '',
  parentPhone: '',
  photoUrl: '',
};

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// Compresses an image file to max 300KB and max 800x800px using the browser Canvas API.
// No external library needed. The original file on the teacher's device is untouched.
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Reduce quality until under ~300KB
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        while (result.length > 300 * 1024 * 1.37 && quality > 0.2) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const StudentsPage = () => {
  const { classes, loading: loadingClasses, noClasses, schoolId } = useTeacherClasses();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [compressing, setCompressing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedClassId || !schoolId) { setStudents([]); return; }
    setLoadingStudents(true);
    api.get<Student[]>(`/schools/${schoolId}/classes/${selectedClassId}/students`)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, schoolId]);

  const filtered = students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB hard limit before compression
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, photo: 'Photo must be under 5MB.' });
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setForm({ ...form, photoUrl: compressed });
      setErrors({ ...errors, photo: '' });
    } catch {
      setErrors({ ...errors, photo: 'Failed to process image. Please try another.' });
    } finally {
      setCompressing(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!selectedClassId) e.class = 'Please select a class first';
    if (form.admissionNumber.trim()) {
      const duplicate = students.find(
        (s) =>
          s.admissionNumber.toLowerCase() === form.admissionNumber.trim().toLowerCase() &&
          s.id !== editingId,
      );
      if (duplicate) e.admissionNumber = 'This admission number already exists in this class';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    const payload = {
      admissionNumber: form.admissionNumber.trim() || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || undefined,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || undefined,
      parentName: form.parentName.trim() || undefined,
      parentPhone: form.parentPhone.trim() || undefined,
      photoUrl: form.photoUrl || undefined,
    };
    try {
      if (editingId) {
        const updated = await api.patch<Student>(
          `/schools/${schoolId}/classes/${selectedClassId}/students/${editingId}`, payload
        );
        setStudents((prev) => prev.map((s) => s.id === editingId ? updated : s));
      } else {
        const created = await api.post<Student>(
          `/schools/${schoolId}/classes/${selectedClassId}/students`, payload
        );
        setStudents((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setErrors({});
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student: Student) => {
    setForm({
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName ?? '',
      gender: student.gender as 'male' | 'female',
      dateOfBirth: student.dateOfBirth ?? '',
      parentName: (student as any).parentName ?? '',
      parentPhone: (student as any).parentPhone ?? '',
      photoUrl: (student as any).photoUrl ?? '',
    });
    setEditingId(student.id);
    setShowForm(true);
    setErrors({});
    setApiError(null);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setApiError(null);
    try {
      await api.delete(`/schools/${schoolId}/classes/${selectedClassId}/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to delete student');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
    setApiError(null);
  };

  return (
    <DashboardLayout>
      {noClasses && (
        <div className="rounded-xl bg-error-container text-on-error-container px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5">warning</span>
          <div>
            <p className="font-bold text-sm">No Classes Assigned</p>
            <p className="text-sm mt-0.5">You have not been assigned to any class yet. Please contact your principal to get assigned before you can access class data.</p>
          </div>
        </div>
      )}
      {!noClasses && (
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Students</h2>
            <p className="text-on-surface-variant text-sm mt-1">Manage students per class</p>
          </div>
          {selectedClassId && !showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Icon name="person_add" /> Add Student
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
              onChange={(e) => { setSelectedClassId(e.target.value); setShowForm(false); setSearch(''); setApiError(null); }}
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
              {editingId ? 'Edit Student' : 'Add New Student'}
            </h3>

            {/* Photo upload */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Passport Photo <span className="normal-case font-normal">(optional — shown on parent portal & report card)</span>
              </label>
              <div className="flex items-center gap-5">
                <div
                  onClick={() => !compressing && photoInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant/40 bg-surface-container flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
                >
                  {compressing ? (
                    <div className="flex flex-col items-center gap-1 text-on-surface-variant/50">
                      <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs">Processing...</span>
                    </div>
                  ) : form.photoUrl ? (
                    <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-on-surface-variant/50">
                      <Icon name="add_a_photo" className="text-3xl" />
                      <span className="text-xs">Upload</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={compressing}
                    className="btn-ghost text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Icon name="upload" className="text-base" />
                    {compressing ? 'Compressing...' : form.photoUrl ? 'Change Photo' : 'Choose Photo'}
                  </button>
                  {form.photoUrl && !compressing && (
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, photoUrl: '' }); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                      className="text-xs text-error hover:underline flex items-center gap-1"
                    >
                      <Icon name="delete" className="text-sm" /> Remove photo
                    </button>
                  )}
                  <p className="text-xs text-on-surface-variant/60">Up to 5MB · JPG, PNG, or WEBP · Auto-compressed</p>
                </div>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
              {errors.photo && <p className="mt-2 text-xs text-error">{errors.photo}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Admission Number <span className="normal-case font-normal">(optional — auto-generated if left blank)</span>
                </label>
                <input
                  value={form.admissionNumber}
                  onChange={(e) => { setForm({ ...form, admissionNumber: e.target.value }); setErrors({ ...errors, admissionNumber: '' }); }}
                  placeholder="Leave blank to auto-generate"
                  className={`input-inset ${errors.admissionNumber ? 'ring-2 ring-error' : ''}`}
                />
                {errors.admissionNumber && <p className="mt-1.5 text-xs text-error">{errors.admissionNumber}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Gender *</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} className="input-inset">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">First Name *</label>
                <input
                  value={form.firstName}
                  onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrors({ ...errors, firstName: '' }); }}
                  placeholder="e.g. Oluwaseun"
                  className={`input-inset ${errors.firstName ? 'ring-2 ring-error' : ''}`}
                />
                {errors.firstName && <p className="mt-1.5 text-xs text-error">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Last Name *</label>
                <input
                  value={form.lastName}
                  onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrors({ ...errors, lastName: '' }); }}
                  placeholder="e.g. Adeyemi"
                  className={`input-inset ${errors.lastName ? 'ring-2 ring-error' : ''}`}
                />
                {errors.lastName && <p className="mt-1.5 text-xs text-error">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Middle Name <span className="normal-case font-normal">(optional)</span></label>
                <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} placeholder="e.g. Chukwuemeka" className="input-inset" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Date of Birth <span className="normal-case font-normal">(optional)</span></label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="input-inset" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Parent/Guardian Name <span className="normal-case font-normal">(optional)</span></label>
                <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="e.g. Mr. Adeyemi Tunde" className="input-inset" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Parent Phone <span className="normal-case font-normal">(optional)</span></label>
                <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="e.g. 08012345678" className="input-inset" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || compressing} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</> : editingId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        )}

        {/* Students list */}
        {selectedClassId && !showForm && (
          <>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" /> Loading students...
              </div>
            ) : students.length === 0 ? (
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
                <div className="px-4 md:px-6 py-4 bg-surface-container-low flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm font-bold text-on-surface">
                    {students.length} student{students.length !== 1 ? 's' : ''} in {classes.find((c) => c.id === selectedClassId)?.name}
                  </span>
                  <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-2 flex-1 min-w-[140px] max-w-xs">
                    <Icon name="search" className="text-on-surface-variant/60 text-base flex-shrink-0" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="bg-transparent text-sm outline-none w-full text-on-surface placeholder:text-on-surface-variant/50" />
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-[3rem_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                    <span />
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Name</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Admission No.</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Parent</span>
                    <span />
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {filtered.map((student) => (
                      <div key={student.id} className="grid grid-cols-[3rem_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
                        {(student as any).photoUrl ? (
                          <img src={(student as any).photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-on-surface text-sm">{student.lastName} {student.firstName}{student.middleName ? ` ${student.middleName}` : ''}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{student.gender === 'male' ? '♂' : '♀'} {student.gender}</p>
                        </div>
                        <p className="text-sm text-on-surface-variant font-medium">{student.admissionNumber}</p>
                        <p className="text-sm text-on-surface-variant">{(student as any).parentName ?? '—'}</p>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleEdit(student)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"><Icon name="edit" className="text-base" /></button>
                          {deleteConfirmId === student.id ? (
                            <div className="flex gap-1 items-center">
                              <button onClick={() => handleDelete(student.id)} disabled={deleting === student.id} className="px-2 py-1 text-xs bg-error text-on-error rounded-lg disabled:opacity-50">{deleting === student.id ? '...' : 'Confirm'}</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs border border-outline-variant/30 rounded-lg">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(student.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"><Icon name="delete" className="text-base" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-outline-variant/10">
                  {filtered.map((student) => (
                    <div key={student.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {(student as any).photoUrl ? (
                          <img src={(student as any).photoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-sm font-bold text-on-surface-variant flex-shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface">{student.lastName} {student.firstName}{student.middleName ? ` ${student.middleName}` : ''}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs text-on-surface-variant">{student.admissionNumber}</span>
                            <span className="text-xs text-on-surface-variant/50">·</span>
                            <span className="text-xs text-on-surface-variant capitalize">{student.gender}</span>
                            {(student as any).parentName && <><span className="text-xs text-on-surface-variant/50">·</span><span className="text-xs text-on-surface-variant">{(student as any).parentName}</span></>}
                          </div>
                        </div>
                      </div>
                      {deleteConfirmId === student.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(student.id)} disabled={deleting === student.id} className="flex-1 py-2.5 text-sm bg-error text-on-error rounded-xl font-bold disabled:opacity-50">{deleting === student.id ? 'Deleting...' : 'Confirm Delete'}</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm border border-outline-variant/30 rounded-xl font-bold text-on-surface-variant">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(student)} className="flex-1 py-2.5 text-sm border border-outline-variant/30 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center gap-2 transition-colors"><Icon name="edit" className="text-base" /> Edit</button>
                          <button onClick={() => setDeleteConfirmId(student.id)} className="flex-1 py-2.5 text-sm border border-error/30 text-error rounded-xl font-bold hover:bg-error-container/20 flex items-center justify-center gap-2 transition-colors"><Icon name="delete" className="text-base" /> Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-4 md:px-6 py-3 bg-surface-container-low border-t border-outline-variant/10">
                  <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
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
      )}
    </DashboardLayout>
  );
};

export default StudentsPage;