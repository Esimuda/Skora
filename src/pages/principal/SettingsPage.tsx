import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDataStore } from "@/store/dataStore";

const Icon = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

export const SettingsPage = () => {
  const { school, setSchool } = useDataStore();

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

  useEffect(() => {
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
        schoolType:
          (school.schoolType as "public" | "private" | "mission") ?? "public",
        templateId: school.templateId ?? "classic",
      });
    }
  }, [school]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSchool({
        id: school?.id ?? `school_${Date.now()}`,
        ...form,
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 500);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              School Settings
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Configure your school's information — appears on all result sheets
            </p>
          </div>
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
      </div>
    </DashboardLayout>
  );
};
