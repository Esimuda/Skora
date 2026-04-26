import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Term } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassItem {
  id: string;
  name: string;
  academicYear: string;
  teacherId?: string;
  teacherName?: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  status: "pending" | "active" | "inactive";
  invitedAt: string;
}
export interface Student {
  id: string;
  classId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender: "male" | "female";
  passportPhoto?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  code?: string;
}

export interface ScoreEntry {
  studentId: string;
  subjectId: string;
  classId: string;
  term: Term;
  academicYear: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

export interface PsychometricEntry {
  studentId: string;
  classId: string;
  term: Term;
  academicYear: string;
  ratings: Record<string, string>; // skillId -> 'A'|'B'|'C'|'D'|'E'
}

export interface AttendanceRecord {
  studentId: string;
  classId: string;
  term: Term;
  academicYear: string;
  daysSchoolOpened: number;
  daysPresent: number;
}

export interface CommentEntry {
  studentId: string;
  classId: string;
  term: Term;
  academicYear: string;
  teacherComment: string;
  principalComment?: string;
}

export type ResultStatus = "draft" | "submitted" | "approved" | "rejected";

export interface ClassResultStatus {
  classId: string;
  className: string;
  term: Term;
  academicYear: string;
  status: ResultStatus;
  teacherName: string;
  studentCount: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  principalComment?: string;
}

export interface AppNotification {
  id: string;
  for: "teacher" | "principal";
  type: "submitted" | "approved" | "rejected";
  title: string;
  message: string;
  classId: string;
  className: string;
  isRead: boolean;
  createdAt: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  motto?: string;
  logo?: string;
  principalName?: string;
  website?: string;
  state?: string;
  lga?: string;
  schoolType?: string;
  templateId: "classic" | "modern" | "hybrid";
}

// ─── Grading helper ───────────────────────────────────────────────────────────

const GRADING = [
  { grade: "A1", min: 75, max: 100, remark: "Excellent" },
  { grade: "B2", min: 70, max: 74, remark: "Very Good" },
  { grade: "B3", min: 65, max: 69, remark: "Good" },
  { grade: "C4", min: 60, max: 64, remark: "Credit" },
  { grade: "C5", min: 55, max: 59, remark: "Credit" },
  { grade: "C6", min: 50, max: 54, remark: "Credit" },
  { grade: "D7", min: 45, max: 49, remark: "Pass" },
  { grade: "E8", min: 40, max: 44, remark: "Pass" },
  { grade: "F9", min: 0, max: 39, remark: "Fail" },
];

export function getGrade(total: number) {
  const g = GRADING.find((g) => total >= g.min && total <= g.max);
  return g
    ? { grade: g.grade, remark: g.remark }
    : { grade: "F9", remark: "Fail" };
}

export const GRADING_SCALE = GRADING;

// ─── Store ────────────────────────────────────────────────────────────────────

interface DataStore {
  school: SchoolInfo | null;
  classes: ClassItem[];
  teachers: TeacherRecord[];
  students: Student[];
  subjects: Subject[];
  scores: ScoreEntry[];
  psychometric: PsychometricEntry[];
  comments: CommentEntry[];
  attendance: AttendanceRecord[];
  resultStatuses: ClassResultStatus[];
  notifications: AppNotification[];

  // School
  setSchool: (school: SchoolInfo) => void;

  // Classes
  addClass: (cls: ClassItem) => void;
  updateClass: (id: string, updates: Partial<ClassItem>) => void;
  // Teachers
  addTeacher: (teacher: TeacherRecord) => void;
  updateTeacher: (id: string, updates: Partial<TeacherRecord>) => void;
  deleteTeacher: (id: string) => void;

  // Students
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentsByClass: (classId: string) => Student[];

  // Subjects
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  getSubjectsByClass: (classId: string) => Subject[];

  // Scores
  saveScore: (score: ScoreEntry) => void;
  getScores: (
    classId: string,
    subjectId: string,
    term: Term,
    academicYear: string,
  ) => ScoreEntry[];
  getStudentScores: (
    studentId: string,
    classId: string,
    term: Term,
    academicYear: string,
  ) => ScoreEntry[];

  // Psychometric
  savePsychometric: (entry: PsychometricEntry) => void;
  getPsychometric: (
    studentId: string,
    classId: string,
    term: Term,
    academicYear: string,
  ) => PsychometricEntry | undefined;
  getClassPsychometric: (
    classId: string,
    term: Term,
    academicYear: string,
  ) => PsychometricEntry[];

  // Attendance
  saveAttendance: (record: AttendanceRecord) => void;
  getAttendance: (
    studentId: string,
    classId: string,
    term: Term,
    academicYear: string,
  ) => AttendanceRecord | undefined;
  getClassAttendance: (
    classId: string,
    term: Term,
    academicYear: string,
  ) => AttendanceRecord[];

  // Comments
  saveComment: (comment: CommentEntry) => void;
  getComment: (
    studentId: string,
    classId: string,
    term: Term,
    academicYear: string,
  ) => CommentEntry | undefined;
  savePrincipalComment: (
    studentId: string,
    classId: string,
    term: Term,
    academicYear: string,
    comment: string,
  ) => void;

  // Result status
  submitResults: (
    classId: string,
    className: string,
    teacherName: string,
    term: Term,
    academicYear: string,
  ) => void;
  approveResults: (
    classId: string,
    term: Term,
    academicYear: string,
    principalComment?: string,
  ) => void;
  rejectResults: (
    classId: string,
    term: Term,
    academicYear: string,
    reason: string,
  ) => void;
  getResultStatus: (
    classId: string,
    term: Term,
    academicYear: string,
  ) => ClassResultStatus | undefined;

  // Notifications
  addNotification: (notif: Omit<AppNotification, "id" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  getNotificationsFor: (role: "teacher" | "principal") => AppNotification[];

  // Computed
  computeClassResults: (
    classId: string,
    term: Term,
    academicYear: string,
  ) => ComputedStudentResult[];
}

export interface ComputedStudentResult {
  student: Student;
  scores: ScoreEntry[];
  psychometric?: PsychometricEntry;
  comment?: CommentEntry;
  attendance?: AttendanceRecord;
  totalScore: number;
  totalPossible: number;
  percentage: number;
  position: number;
  totalStudents: number;
  classHighest: number;
  classAverage: number;
}

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      school: null,
      classes: [],
      teachers: [],
      students: [],
      subjects: [],
      scores: [],
      psychometric: [],
      comments: [],
      attendance: [],
      resultStatuses: [],
      notifications: [],

      setSchool: (school) => set({ school }),

      addClass: (cls) => set((s) => ({ classes: [...s.classes, cls] })),
      updateClass: (id, updates) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),
      addTeacher: (teacher) =>
        set((s) => ({ teachers: [...s.teachers, teacher] })),
      updateTeacher: (id, updates) =>
        set((s) => ({
          teachers: s.teachers.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),
      deleteTeacher: (id) =>
        set((s) => ({ teachers: s.teachers.filter((t) => t.id !== id) })),
      addStudent: (student) =>
        set((s) => ({ students: [...s.students, student] })),
      updateStudent: (id, updates) =>
        set((s) => ({
          students: s.students.map((st) =>
            st.id === id ? { ...st, ...updates } : st,
          ),
        })),
      deleteStudent: (id) =>
        set((s) => ({ students: s.students.filter((st) => st.id !== id) })),
      getStudentsByClass: (classId) =>
        get().students.filter((s) => s.classId === classId),

      addSubject: (subject) =>
        set((s) => ({ subjects: [...s.subjects, subject] })),
      updateSubject: (id, updates) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === id ? { ...sub, ...updates } : sub,
          ),
        })),
      deleteSubject: (id) =>
        set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) })),
      getSubjectsByClass: (classId) =>
        get().subjects.filter((s) => s.classId === classId),

      saveScore: (score) =>
        set((s) => {
          const filtered = s.scores.filter(
            (sc) =>
              !(
                sc.studentId === score.studentId &&
                sc.subjectId === score.subjectId &&
                sc.classId === score.classId &&
                sc.term === score.term &&
                sc.academicYear === score.academicYear
              ),
          );
          return { scores: [...filtered, score] };
        }),

      getScores: (classId, subjectId, term, academicYear) =>
        get().scores.filter(
          (s) =>
            s.classId === classId &&
            s.subjectId === subjectId &&
            s.term === term &&
            s.academicYear === academicYear,
        ),

      getStudentScores: (studentId, classId, term, academicYear) =>
        get().scores.filter(
          (s) =>
            s.studentId === studentId &&
            s.classId === classId &&
            s.term === term &&
            s.academicYear === academicYear,
        ),

      savePsychometric: (entry) =>
        set((s) => {
          const filtered = s.psychometric.filter(
            (p) =>
              !(
                p.studentId === entry.studentId &&
                p.classId === entry.classId &&
                p.term === entry.term &&
                p.academicYear === entry.academicYear
              ),
          );
          return { psychometric: [...filtered, entry] };
        }),

      getPsychometric: (studentId, classId, term, academicYear) =>
        get().psychometric.find(
          (p) =>
            p.studentId === studentId &&
            p.classId === classId &&
            p.term === term &&
            p.academicYear === academicYear,
        ),

      getClassPsychometric: (classId, term, academicYear) =>
        get().psychometric.filter(
          (p) =>
            p.classId === classId &&
            p.term === term &&
            p.academicYear === academicYear,
        ),

      saveAttendance: (record) =>
        set((s) => {
          const filtered = s.attendance.filter(
            (a) =>
              !(
                a.studentId === record.studentId &&
                a.classId === record.classId &&
                a.term === record.term &&
                a.academicYear === record.academicYear
              ),
          );
          return { attendance: [...filtered, record] };
        }),

      getAttendance: (studentId, classId, term, academicYear) =>
        get().attendance.find(
          (a) =>
            a.studentId === studentId &&
            a.classId === classId &&
            a.term === term &&
            a.academicYear === academicYear,
        ),

      getClassAttendance: (classId, term, academicYear) =>
        get().attendance.filter(
          (a) =>
            a.classId === classId &&
            a.term === term &&
            a.academicYear === academicYear,
        ),
      saveComment: (comment) =>
        set((s) => {
          const filtered = s.comments.filter(
            (c) =>
              !(
                c.studentId === comment.studentId &&
                c.classId === comment.classId &&
                c.term === comment.term &&
                c.academicYear === comment.academicYear
              ),
          );
          return { comments: [...filtered, comment] };
        }),

      getComment: (studentId, classId, term, academicYear) =>
        get().comments.find(
          (c) =>
            c.studentId === studentId &&
            c.classId === classId &&
            c.term === term &&
            c.academicYear === academicYear,
        ),

      savePrincipalComment: (
        studentId,
        classId,
        term,
        academicYear,
        principalComment,
      ) =>
        set((s) => {
          const existing = s.comments.find(
            (c) =>
              c.studentId === studentId &&
              c.classId === classId &&
              c.term === term &&
              c.academicYear === academicYear,
          );
          if (existing) {
            return {
              comments: s.comments.map((c) =>
                c.studentId === studentId &&
                c.classId === classId &&
                c.term === term &&
                c.academicYear === academicYear
                  ? { ...c, principalComment }
                  : c,
              ),
            };
          }
          return {
            comments: [
              ...s.comments,
              {
                studentId,
                classId,
                term,
                academicYear,
                teacherComment: "",
                principalComment,
              },
            ],
          };
        }),

      submitResults: (classId, className, teacherName, term, academicYear) => {
        const students = get().getStudentsByClass(classId);
        const existing = get().resultStatuses.find(
          (r) =>
            r.classId === classId &&
            r.term === term &&
            r.academicYear === academicYear,
        );
        const entry: ClassResultStatus = existing
          ? {
              ...existing,
              status: "submitted",
              submittedAt: new Date().toISOString(),
            }
          : {
              classId,
              className,
              term,
              academicYear,
              status: "submitted",
              teacherName,
              studentCount: students.length,
              submittedAt: new Date().toISOString(),
            };
        set((s) => ({
          resultStatuses: [
            ...s.resultStatuses.filter(
              (r) =>
                !(
                  r.classId === classId &&
                  r.term === term &&
                  r.academicYear === academicYear
                ),
            ),
            entry,
          ],
        }));
        get().addNotification({
          for: "principal",
          type: "submitted",
          title: `Results Ready — ${className}`,
          message: `${teacherName} has submitted ${className} results for ${term} term ${academicYear}. Awaiting your approval.`,
          classId,
          className,
          isRead: false,
        });
      },

      approveResults: (classId, term, academicYear, principalComment) => {
        set((s) => ({
          resultStatuses: s.resultStatuses.map((r) =>
            r.classId === classId &&
            r.term === term &&
            r.academicYear === academicYear
              ? {
                  ...r,
                  status: "approved",
                  approvedAt: new Date().toISOString(),
                  principalComment,
                }
              : r,
          ),
        }));
        const rs = get().resultStatuses.find(
          (r) =>
            r.classId === classId &&
            r.term === term &&
            r.academicYear === academicYear,
        );
        get().addNotification({
          for: "teacher",
          type: "approved",
          title: `Results Approved ✅ — ${rs?.className}`,
          message: `${rs?.className} results have been approved. Results are now available for download.`,
          classId,
          className: rs?.className || classId,
          isRead: false,
        });
      },

      rejectResults: (classId, term, academicYear, reason) => {
        set((s) => ({
          resultStatuses: s.resultStatuses.map((r) =>
            r.classId === classId &&
            r.term === term &&
            r.academicYear === academicYear
              ? {
                  ...r,
                  status: "rejected",
                  rejectedAt: new Date().toISOString(),
                  rejectionReason: reason,
                }
              : r,
          ),
        }));
        const rs = get().resultStatuses.find(
          (r) =>
            r.classId === classId &&
            r.term === term &&
            r.academicYear === academicYear,
        );
        get().addNotification({
          for: "teacher",
          type: "rejected",
          title: `Results Returned ↩ — ${rs?.className}`,
          message: `${rs?.className} results were returned for revision. Reason: ${reason}`,
          classId,
          className: rs?.className || classId,
          isRead: false,
        });
      },

      getResultStatus: (classId, term, academicYear) =>
        get().resultStatuses.find(
          (r) =>
            r.classId === classId &&
            r.term === term &&
            r.academicYear === academicYear,
        ),

      addNotification: (notif) =>
        set((s) => ({
          notifications: [
            ...s.notifications,
            {
              ...notif,
              id: `notif_${Date.now()}_${Math.random()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      getNotificationsFor: (role) =>
        get().notifications.filter((n) => n.for === role),

      computeClassResults: (classId, term, academicYear) => {
        const students = get().getStudentsByClass(classId);
        if (students.length === 0) return [];

        const results = students.map((student) => {
          const scores = get().getStudentScores(
            student.id,
            classId,
            term,
            academicYear,
          );
          const totalScore = scores.reduce((sum, s) => sum + s.total, 0);
          const totalPossible = scores.length * 100;
          const percentage =
            totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
          const psychometric = get().getPsychometric(
            student.id,
            classId,
            term,
            academicYear,
          );
          const comment = get().getComment(
            student.id,
            classId,
            term,
            academicYear,
          );
          const attendance = get().getAttendance(
            student.id,
            classId,
            term,
            academicYear,
          );
          return {
            student,
            scores,
            psychometric,
            comment,
            attendance,
            totalScore,
            totalPossible,
            percentage,
          };
        });

        // Sort by percentage descending to assign positions
        const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
        const classHighest = sorted[0]?.percentage ?? 0;
        const classAverage =
          results.length > 0
            ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
            : 0;

        return sorted.map((r, i) => ({
          ...r,
          position: i + 1,
          totalStudents: students.length,
          classHighest,
          classAverage,
        }));
      },
    }),
    {
      name: "skora-data-store",
    },
  ),
);
