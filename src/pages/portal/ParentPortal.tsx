import { useState, useRef } from "react";
import { getAcademicYearOptions, getCurrentTerm, getCurrentAcademicYear } from "@/components/ui/TermSelector";
import { ClassicResultSheet } from "@/templates/ClassicResultSheet";
import { ModernResultSheet } from "@/templates/ModernResultSheet";
import { HybridResultSheet } from "@/templates/HybridResultSheet";
import type { Term, School } from "@/types";

type Step = "school" | "class" | "student" | "confirm" | "term" | "pin" | "result";
type ViewMode = "full" | "summary";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

function toStudentResult(result: any, term: Term) {
  return {
    student: result.student,
    scores: (result.scores ?? []).map((s: any) => ({
      ...s,
      term,
      academicYear: result.academicYear,
    })),
    psychometricAssessment: result.psychometricAssessment ?? undefined,
    comment: result.comment ?? undefined,
    totalScore: result.totalScore,
    totalPossible: result.totalPossible,
    percentage: result.percentage,
    position: result.position,
    totalStudents: result.totalStudents,
    classHighest: result.classHighest,
    classAverage: result.classAverage,
    term,
    academicYear: result.academicYear,
  };
}

function FullResultSheet({ result, school, term }: { result: any; school: School; term: Term }) {
  const studentResult = toStudentResult(result, term);
  switch (school.templateId) {
    case "modern":
      return <ModernResultSheet result={studentResult} school={school} watermarked={false} />;
    case "hybrid":
      return <HybridResultSheet result={studentResult} school={school} watermarked={false} />;
    default:
      return <ClassicResultSheet result={studentResult} school={school} watermarked={false} />;
  }
}

export const ParentPortal = () => {
  const [step, setStep] = useState<Step>("school");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("full");
  const printRef = useRef<HTMLDivElement>(null);

  const [schoolCode, setSchoolCode] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [term, setTerm] = useState<Term>(() => getCurrentTerm() as Term);
  const [academicYear, setAcademicYear] = useState(() => getCurrentAcademicYear());
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<any>(null);
  const [resultSchool, setResultSchool] = useState<School | null>(null);

  const handleLookupSchool = async () => {
    const code = schoolCode.trim().toUpperCase();
    if (!code) { setError("Please enter your school code."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/portal/schools/lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "School not found.");
      setSelectedSchool(data);
      const cRes = await fetch(`${API}/portal/schools/${data.id}/classes`);
      const cData = await cRes.json();
      if (!cRes.ok) throw new Error("Could not load classes for this school.");
      setClasses(Array.isArray(cData) ? cData : cData.data ?? []);
      setStep("class");
    } catch (e: any) {
      setError(e.message ?? "Could not find school. Please check the code and try again.");
    } finally { setLoading(false); }
  };

  const loadStudents = async (cls: any) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/portal/schools/${selectedSchool.id}/classes/${cls.id}/students`);
      const data = await res.json();
      if (!res.ok) throw new Error("Could not load students.");
      setStudents(Array.isArray(data) ? data : data.data ?? []);
      setSelectedClass(cls);
      setStep("student");
    } catch (e: any) {
      setError(e.message ?? "Could not load students.");
    } finally { setLoading(false); }
  };

  const handleValidatePin = async () => {
    if (!pin.trim()) { setError("Please enter your PIN."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/portal/validate-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchool.id,
          studentId: selectedStudent.id,
          term,
          academicYear,
          pin: pin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Use the exact message from the backend — it's already human-readable
        throw new Error(data.message ?? "PIN validation failed. Please try again.");
      }
      setResult(data.result);
      setResultSchool(data.school);
      setViewMode("full");
      setStep("result");
    } catch (e: any) {
      setError(e.message ?? "PIN validation failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  const reset = () => {
    setStep("school"); setSchoolCode(""); setSelectedSchool(null);
    setSelectedClass(null); setSelectedStudent(null); setPin("");
    setResult(null); setResultSchool(null); setError(null); setViewMode("full");
  };

  const STEPS: Step[] = ["school", "class", "student", "confirm", "term", "pin", "result"];
  const stepIndex = STEPS.indexOf(step);
  const getTermName = (t: Term) => t === "first" ? "First" : t === "second" ? "Second" : "Third";

  return (
    <>
      {/* Hidden print area — always in DOM, only visible when printing */}
      <div id="skora-print-area" ref={printRef} style={{ display: 'none' }}>
        {result && resultSchool && (
          <FullResultSheet result={result} school={resultSchool} term={term} />
        )}
      </div>

      <div id="skora-no-print" className="min-h-screen bg-surface flex flex-col">
        {/* Header */}
        <div className="bg-primary text-on-primary px-6 py-4 flex items-center justify-between shadow-lg">
          <div>
            <h1 className="font-headline font-extrabold text-xl tracking-tight">Skora RMS</h1>
            <p className="text-on-primary/70 text-xs mt-0.5">Parent Result Portal</p>
          </div>
          {step !== "school" && (
            <button onClick={reset} className="text-on-primary/70 text-sm flex items-center gap-1 hover:text-on-primary">
              <Icon name="restart_alt" className="text-base" /> Start over
            </button>
          )}
        </div>

        {/* Result step */}
        {step === "result" && result && resultSchool ? (
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="bg-surface-container-low border-b border-outline-variant/20 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Icon name="check_circle" className="text-secondary text-lg" />
                <div>
                  <p className="font-bold text-on-surface text-sm">
                    {result.student?.lastName} {result.student?.firstName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {getTermName(term)} Term · {academicYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center bg-surface-container border border-outline-variant/20 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setViewMode("full")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "full"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <Icon name="article" className="text-sm" /> Full Result
                  </button>
                  <button
                    onClick={() => setViewMode("summary")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "summary"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <Icon name="summarize" className="text-sm" /> Summary
                  </button>
                </div>

                {viewMode === "full" && (
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    <Icon name="print" className="text-sm" /> Print / Save PDF
                  </button>
                )}
              </div>
            </div>

            {/* Full result sheet */}
            {viewMode === "full" && (
              <div className="flex-1 overflow-auto bg-gray-100 py-6 flex justify-center">
                <div className="w-full max-w-[794px]">
                  <FullResultSheet result={result} school={resultSchool} term={term} />
                </div>
              </div>
            )}

            {/* Summary view */}
            {viewMode === "summary" && (
              <div className="flex-1 flex items-start justify-center px-4 py-8">
                <div className="w-full max-w-lg space-y-4">
                  <div className="ledger-card p-5 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-black text-primary">{result.percentage?.toFixed(1)}%</p>
                      <p className="text-xs text-on-surface-variant">Average</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-primary">{result.position}</p>
                      <p className="text-xs text-on-surface-variant">Position</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-primary">{result.totalStudents}</p>
                      <p className="text-xs text-on-surface-variant">In class</p>
                    </div>
                  </div>

                  <div className="ledger-card overflow-hidden">
                    <div className="px-4 py-2 bg-surface-container-low">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Subject Scores</p>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {result.scores?.map((score: any) => (
                        <div key={score.id} className="px-4 py-2.5 flex items-center justify-between">
                          <p className="text-sm text-on-surface font-medium">{score.subjectName ?? score.subjectId}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-on-surface">{score.total}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{score.grade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.comment?.teacherComment && (
                    <div className="ledger-card p-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Teacher's Comment</p>
                      <p className="text-sm text-on-surface italic">"{result.comment.teacherComment}"</p>
                    </div>
                  )}
                  {result.comment?.principalComment && (
                    <div className="ledger-card p-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Principal's Comment</p>
                      <p className="text-sm text-on-surface italic">"{result.comment.principalComment}"</p>
                    </div>
                  )}

                  <button onClick={reset} className="w-full btn-ghost text-sm">
                    <Icon name="home" className="text-base" /> Back to start
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* All other steps */
          <div className="flex-1 flex items-start justify-center px-4 py-8">
            <div className="w-full max-w-lg">
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {STEPS.map((s, i) => (
                  <div key={s} className={`rounded-full transition-all ${
                    s === step ? "w-6 h-2 bg-primary" :
                    i < stepIndex ? "w-2 h-2 bg-primary/40" : "w-2 h-2 bg-outline-variant/30"
                  }`} />
                ))}
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-start gap-2">
                  <Icon name="error" className="text-base flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-3 py-12 text-on-surface-variant">
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}

              {/* STEP 1: School code */}
              {step === "school" && !loading && (
                <div className="ledger-card p-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-5">
                    <Icon name="school" className="text-primary text-2xl" />
                  </div>
                  <h2 className="font-headline font-bold text-lg text-on-surface mb-1 text-center">Enter your school code</h2>
                  <p className="text-sm text-on-surface-variant mb-6 text-center">
                    Your school's unique portal code — ask your school's principal if you don't have it.
                  </p>
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLookupSchool(); }}
                    placeholder="e.g. GRNFLD"
                    maxLength={8}
                    className="input-inset text-center font-mono text-2xl tracking-[0.3em] uppercase mb-4"
                    autoComplete="off"
                  />
                  <button onClick={handleLookupSchool} disabled={!schoolCode.trim()} className="w-full btn-primary text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    <Icon name="search" className="text-base" /> Find School
                  </button>
                </div>
              )}

              {/* STEP 2: Select class */}
              {step === "class" && !loading && (
                <div className="ledger-card p-6">
                  <button onClick={() => setStep("school")} className="text-sm text-on-surface-variant flex items-center gap-1 mb-4">
                    <Icon name="arrow_back" className="text-base" /> Back
                  </button>
                  <h2 className="font-headline font-bold text-lg text-on-surface mb-1">Select your child's class</h2>
                  <p className="text-xs text-on-surface-variant mb-5">{selectedSchool?.name}</p>
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {classes.map((cls) => (
                      <button key={cls.id} onClick={() => loadStudents(cls)}
                        className="p-4 rounded-xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                        <p className="font-bold text-on-surface text-sm">{cls.name}</p>
                        {cls.section && <p className="text-xs text-on-surface-variant">{cls.section}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Select student */}
              {step === "student" && !loading && (
                <div className="ledger-card p-6">
                  <button onClick={() => setStep("class")} className="text-sm text-on-surface-variant flex items-center gap-1 mb-4">
                    <Icon name="arrow_back" className="text-base" /> Back
                  </button>
                  <h2 className="font-headline font-bold text-lg text-on-surface mb-1">Select your child's name</h2>
                  <p className="text-xs text-on-surface-variant mb-5">{selectedSchool?.name} · {selectedClass?.name}</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {students.map((student) => (
                      <button key={student.id} onClick={() => { setSelectedStudent(student); setStep("confirm"); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-sm">{student.firstName?.[0]}{student.lastName?.[0]}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-on-surface text-sm">{student.lastName} {student.firstName} {student.middleName ?? ""}</p>
                          <p className="text-xs text-on-surface-variant">{student.admissionNumber}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Confirm child */}
              {step === "confirm" && selectedStudent && (
                <div className="ledger-card p-6 text-center">
                  <button onClick={() => setStep("student")} className="text-sm text-on-surface-variant flex items-center gap-1 mb-6">
                    <Icon name="arrow_back" className="text-base" /> Back
                  </button>
                  <div className="mb-6">
                    {selectedStudent.photoUrl ? (
                      <img src={selectedStudent.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary/20" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-primary font-bold text-2xl">{selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}</span>
                      </div>
                    )}
                    <h2 className="font-headline font-bold text-xl text-on-surface">{selectedStudent.lastName} {selectedStudent.firstName}</h2>
                    <p className="text-sm text-on-surface-variant mt-1">{selectedStudent.admissionNumber}</p>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-6">Is this your child?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setStep("student")} className="flex-1 btn-ghost text-sm">No, go back</button>
                    <button onClick={() => setStep("term")} className="flex-1 btn-primary text-sm">Yes, continue</button>
                  </div>
                </div>
              )}

              {/* STEP 5: Select term */}
              {step === "term" && (
                <div className="ledger-card p-6">
                  <button onClick={() => setStep("confirm")} className="text-sm text-on-surface-variant flex items-center gap-1 mb-4">
                    <Icon name="arrow_back" className="text-base" /> Back
                  </button>
                  <h2 className="font-headline font-bold text-lg text-on-surface mb-1">Select the term</h2>
                  <p className="text-xs text-on-surface-variant mb-5">Which result do you want to view?</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Term</label>
                      <select value={term} onChange={(e) => setTerm(e.target.value as Term)} className="input-inset">
                        <option value="first">First Term</option>
                        <option value="second">Second Term</option>
                        <option value="third">Third Term</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Academic Year</label>
                      <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input-inset">
                        {getAcademicYearOptions(5).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => setStep("pin")} className="w-full btn-primary text-sm">Continue</button>
                  </div>
                </div>
              )}

              {/* STEP 6: Enter PIN */}
              {step === "pin" && (
                <div className="ledger-card p-6">
                  <button onClick={() => setStep("term")} className="text-sm text-on-surface-variant flex items-center gap-1 mb-4">
                    <Icon name="arrow_back" className="text-base" /> Back
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="style" className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-headline font-bold text-lg text-on-surface">Enter your PIN</h2>
                      <p className="text-xs text-on-surface-variant">From your scratch card — format: XXXX-XXXX-XXXX</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                    placeholder="e.g. 1234-5678-9012"
                    maxLength={14}
                    className="input-inset text-center font-mono text-lg tracking-widest mb-2"
                    onKeyDown={(e) => { if (e.key === "Enter") handleValidatePin(); }}
                  />
                  <p className="text-xs text-on-surface-variant text-center mb-6">Each PIN is valid for 5 uses. Do not share your PIN.</p>
                  <button onClick={handleValidatePin} disabled={loading || !pin.trim()}
                    className="w-full btn-primary text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Validating...</>
                    ) : (
                      <><Icon name="lock_open" className="text-base" /> View Result</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
