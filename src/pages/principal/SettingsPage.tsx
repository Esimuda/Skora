import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDataStore } from "@/store/dataStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { ClassicResultSheet } from "@/templates/ClassicResultSheet";
import { ModernResultSheet } from "@/templates/ModernResultSheet";
import { HybridResultSheet } from "@/templates/HybridResultSheet";
import { StudentResult, School } from "@/types";

const PREVIEW_RESULT: StudentResult = {
  student: {
    id: "preview_student",
    classId: "JSS 2A",
    admissionNumber: "SKR/2024/007",
    firstName: "Oluwafemi",
    lastName: "Adeyemi",
    middleName: "Blessing",
    gender: "male",
    createdAt: "",
    updatedAt: "",
  },
  scores: [
    { id: "s1", studentId: "p", subjectId: "Mathematics", term: "first", academicYear: "2024/2025", ca1: 18, ca2: 17, exam: 58, total: 93, grade: "A1", remark: "Excellent", createdAt: "", updatedAt: "" },
    { id: "s2", studentId: "p", subjectId: "English Language", term: "first", academicYear: "2024/2025", ca1: 15, ca2: 16, exam: 52, total: 83, grade: "A1", remark: "Excellent", createdAt: "", updatedAt: "" },
    { id: "s3", studentId: "p", subjectId: "Basic Science", term: "first", academicYear: "2024/2025", ca1: 14, ca2: 15, exam: 45, total: 74, grade: "B2", remark: "Very Good", createdAt: "", updatedAt: "" },
    { id: "s4", studentId: "p", subjectId: "Social Studies", term: "first", academicYear: "2024/2025", ca1: 16, ca2: 14, exam: 47, total: 77, grade: "A1", remark: "Excellent", createdAt: "", updatedAt: "" },
    { id: "s5", studentId: "p", subjectId: "Agricultural Science", term: "first", academicYear: "2024/2025", ca1: 13, ca2: 14, exam: 42, total: 69, grade: "B3", remark: "Good", createdAt: "", updatedAt: "" },
    { id: "s6", studentId: "p", subjectId: "Civic Education", term: "first", academicYear: "2024/2025", ca1: 15, ca2: 14, exam: 48, total: 77, grade: "A1", remark: "Excellent", createdAt: "", updatedAt: "" },
    { id: "s7", studentId: "p", subjectId: "Fine Art", term: "first", academicYear: "2024/2025", ca1: 17, ca2: 16, exam: 55, total: 88, grade: "A1", remark: "Excellent", createdAt: "", updatedAt: "" },
    { id: "s8", studentId: "p", subjectId: "Physical & Health Education", term: "first", academicYear: "2024/2025", ca1: 18, ca2: 17, exam: 55, total: 90, grade: "A1", remark: "Excellent", createdAt: "", updatedAt: "" },
  ],
  psychometricAssessment: {
    id: "mock_psych",
    studentId: "preview_student",
    classId: "JSS 2A",
    term: "first",
    academicYear: "2024/2025",
    ratings: {
      Punctuality: 5, Attentiveness: 4, Obedience: 5, Resilience: 4,
      Teamwork: 5, Neatness: 4, Honesty: 5, Leadership: 3,
      Handwriting: 4, "Drawing/Art": 5, "Sports/Games": 4, "Practical Skills": 4,
    },
    createdAt: "",
    updatedAt: "",
  },
  comment: {
    id: "mock_comment",
    studentId: "preview_student",
    classId: "JSS 2A",
    term: "first",
    academicYear: "2024/2025",
    teacherComment: "Oluwafemi has shown remarkable dedication and academic excellence this term. Keep it up!",
    principalComment: "An outstanding student. I am proud of your achievements. Continue to strive for excellence.",
    createdAt: "",
    updatedAt: "",
  },
  totalScore: 651,
  totalPossible: 800,
  percentage: 81.4,
  position: 2,
  totalStudents: 38,
  classHighest: 673,
  classAverage: 598,
  term: "first",
  academicYear: "2024/2025",
};

const Icon = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

export const SettingsPage = () => {
  const { school, setSchool } = useDataStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    phoneNumber: "",
    motto: "",
    principalName: "",
    website: "",
    state: "",
    lga: "",
    schoolType: "public" as "public" | "private" | "mission",
    templateId: "classic" as "classic" | "modern" | "hybrid",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const buildPreviewSchool = (): School => ({
    id: "preview",
    name: form.name || "Government Secondary School, Ikeja",
    address: form.address || "No. 45 Allen Avenue, Ikeja, Lagos",
    email: form.email || "info@gssikeja.edu.ng",
    phoneNumber: form.phoneNumber || "+234 803 456 7890",
    motto: form.motto || "Knowledge is Power",
    principalName: form.principalName || "Mr. Adebayo Johnson",
    website: form.website,
    state: form.state || "Lagos",
    lga: form.lga || "Ikeja",
    schoolType: form.schoolType,
    templateId: form.templateId,
    createdAt: "",
    updatedAt: "",
  });

  useEffect(() => {
    if (!user?.schoolId) return;
    api.get<School>(`/schools/${user.schoolId}`).then((s) => {
      setSchool(s);
      setForm({
        name: s.name ?? "",
        address: s.address ?? "",
        email: s.email ?? "",
        phoneNumber: s.phoneNumber ?? "",
        motto: s.motto ?? "",
        principalName: s.principalName ?? "",
        website: s.website ?? "",
        state: s.state ?? "",
        lga: s.lga ?? "",
        schoolType: (s.schoolType as "public" | "private" | "mission") ?? "public",
        templateId: s.templateId ?? "classic",
      });
    }).catch(() => {
      // fall back to store data if already loaded
      if (school) {
        setForm({
          name: school.name ?? "",
          address: school.address ?? "",
          email: school.email ?? "",
          phoneNumber: school.phoneNumber ?? "",
          motto: school.motto ?? "",
          principalName: school.principalName ?? "",
          website: school.website ?? "",
          state: school.state ?? "",
          lga: school.lga ?? "",
          schoolType: (school.schoolType as "public" | "private" | "mission") ?? "public",
          templateId: school.templateId ?? "classic",
        });
      }
    });
  }, [user?.schoolId]);

  const handleSave = async () => {
    if (!user?.schoolId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.put<School>(`/schools/${user.schoolId}`, form);
      setSchool(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!user?.schoolId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/schools/${user.schoolId}`);
      logout();
      navigate("/login");
    } catch (e: any) {
      setDeleteError(e.message ?? "Failed to delete school");
      setDeleting(false);
    }
  };

  const inputCls = "input-inset";
  const labelCls =
    "block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2";

  const NIGERIAN_STATES = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
              School Settings
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Configure your school's information — appears on all result sheets
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary text-sm disabled:opacity-60 flex items-center justify-center gap-2 flex-shrink-0 ${saved ? "from-secondary to-secondary bg-secondary" : ""}`}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />{" "}
                Saving...
              </>
            ) : saved ? (
              <>
                <Icon name="check" /> Saved!
              </>
            ) : (
              <>
                <Icon name="save" /> Save Changes
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm">{error}</div>
        )}

        {/* School Identity */}
        <div className="ledger-card p-6">
          <h3 className="font-headline font-bold text-lg text-primary mb-5 flex items-center gap-2">
            <Icon name="apartment" /> School Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>School Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Government Secondary School, Ikeja"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>School Address *</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. No. 45, Allen Avenue, Ikeja"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputCls}
              >
                <option value="">— Select State —</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>LGA</label>
              <input
                value={form.lga}
                onChange={(e) => setForm({ ...form, lga: e.target.value })}
                placeholder="e.g. Ikeja"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>School Type</label>
              <select
                value={form.schoolType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schoolType: e.target.value as
                      | "public"
                      | "private"
                      | "mission",
                  })
                }
                className={inputCls}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="mission">Mission</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>School Motto</label>
              <input
                value={form.motto}
                onChange={(e) => setForm({ ...form, motto: e.target.value })}
                placeholder="e.g. Knowledge is Power"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="ledger-card p-6">
          <h3 className="font-headline font-bold text-lg text-primary mb-5 flex items-center gap-2">
            <Icon name="contacts" /> Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email Address *</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. info@school.edu.ng"
                className={inputCls}
                type="email"
              />
            </div>
            <div>
              <label className={labelCls}>Phone Number *</label>
              <input
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
                placeholder="e.g. +234 803 456 7890"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Website{" "}
                <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="e.g. www.school.edu.ng"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Principal's Name</label>
              <input
                value={form.principalName}
                onChange={(e) =>
                  setForm({ ...form, principalName: e.target.value })
                }
                placeholder="e.g. Mr. Adebayo Johnson"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Result Template */}
        <div className="ledger-card p-6">
          <h3 className="font-headline font-bold text-lg text-primary mb-2 flex items-center gap-2">
            <Icon name="description" /> Result Sheet Template
          </h3>
          <p className="text-sm text-on-surface-variant mb-5">
            Choose how result sheets look when printed
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["classic", "modern", "hybrid"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, templateId: t })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.templateId === t
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/20 hover:border-primary/30"
                }`}
              >
                <p
                  className={`font-bold capitalize mb-1 ${form.templateId === t ? "text-primary" : "text-on-surface"}`}
                >
                  {t}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {t === "classic"
                    ? "Traditional bordered layout with double-line header"
                    : t === "modern"
                      ? "Clean purple gradient design with card layout"
                      : "Combination of classic structure with modern styling"}
                </p>
                {form.templateId === t && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                    <Icon name="check_circle" className="text-sm" /> Selected
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowPreview(true)}
            className="btn-ghost flex items-center gap-2 text-sm border border-outline-variant/30 rounded-xl px-5 py-2.5"
          >
            <Icon name="visibility" /> Preview Result Format
          </button>
        </div>

        {/* Save button bottom */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary text-sm disabled:opacity-60 flex items-center gap-2 ${saved ? "from-secondary to-secondary bg-secondary" : ""}`}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />{" "}
                Saving...
              </>
            ) : saved ? (
              <>
                <Icon name="check" /> Saved!
              </>
            ) : (
              <>
                <Icon name="save" /> Save Changes
              </>
            )}
          </button>
        </div>
        {/* Danger Zone */}
        <div className="ledger-card p-6 border border-error/30">
          <h3 className="font-headline font-bold text-lg text-error mb-1 flex items-center gap-2">
            <Icon name="warning" /> Danger Zone
          </h3>
          <p className="text-sm text-on-surface-variant mb-4">
            Permanently delete this school account and all associated data — teachers, classes, students, results, and scores. This cannot be undone.
          </p>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); setDeleteError(null); }}
            className="px-4 py-2 text-sm font-bold text-error border border-error/40 rounded-xl hover:bg-error-container/20 transition-colors"
          >
            Delete School Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
              <h3 className="font-headline font-bold text-xl text-error">Delete School Account</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              This will permanently delete <strong>{school?.name ?? "your school"}</strong> and all its data. Type the school name below to confirm.
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={school?.name ?? "School name"}
              className="input-inset"
            />
            {deleteError && (
              <p className="text-sm text-error">{deleteError}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSchool}
                disabled={deleting || deleteConfirmText.trim() !== (school?.name ?? "").trim()}
                className="flex-1 py-2.5 text-sm font-bold bg-error text-on-error rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
              >
                {deleting ? (
                  <><span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" /> Deleting...</>
                ) : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Format Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-5 py-3 bg-surface border-b border-outline-variant/20 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-headline font-bold text-primary text-base">
                Result Format Preview
              </p>
              <p className="text-xs text-on-surface-variant capitalize">
                {form.templateId} template · First Term · 2024/2025
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="btn-ghost p-2 rounded-full"
              aria-label="Close preview"
            >
              <Icon name="close" />
            </button>
          </div>

          {/* Scrollable preview area */}
          <div
            className="flex-1 overflow-auto flex justify-center py-8 px-4"
            onClick={() => setShowPreview(false)}
          >
            <div
              style={{ zoom: 0.65, transformOrigin: "top center" }}
              onClick={(e) => e.stopPropagation()}
            >
              {form.templateId === "modern" ? (
                <ModernResultSheet result={PREVIEW_RESULT} school={buildPreviewSchool()} />
              ) : form.templateId === "hybrid" ? (
                <HybridResultSheet result={PREVIEW_RESULT} school={buildPreviewSchool()} />
              ) : (
                <ClassicResultSheet result={PREVIEW_RESULT} school={buildPreviewSchool()} />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
