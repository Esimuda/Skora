// User Roles
export type UserRole = 'admin' | 'school_admin' | 'teacher';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface School {
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
  schoolType?: 'public' | 'private' | 'mission';
  templateId: 'classic' | 'modern' | 'hybrid';
  createdAt: string;
  updatedAt: string;
}

export interface GradingScale {
  id: string;
  schoolId: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  remark: string;
}

export const DEFAULT_NIGERIAN_GRADING: Omit<GradingScale, 'id' | 'schoolId'>[] = [
  { grade: 'A1', minPercentage: 75, maxPercentage: 100, remark: 'Excellent' },
  { grade: 'B2', minPercentage: 70, maxPercentage: 74, remark: 'Very Good' },
  { grade: 'B3', minPercentage: 65, maxPercentage: 69, remark: 'Good' },
  { grade: 'C4', minPercentage: 60, maxPercentage: 64, remark: 'Credit' },
  { grade: 'C5', minPercentage: 55, maxPercentage: 59, remark: 'Credit' },
  { grade: 'C6', minPercentage: 50, maxPercentage: 54, remark: 'Credit' },
  { grade: 'D7', minPercentage: 45, maxPercentage: 49, remark: 'Pass' },
  { grade: 'E8', minPercentage: 40, maxPercentage: 44, remark: 'Pass' },
  { grade: 'F9', minPercentage: 0, maxPercentage: 39, remark: 'Fail' },
];
// ...existing code...

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  section?: string;
  level?: string;
  academicYear: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  classes: string[];
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  classId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  passportPhoto?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  code?: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export type Term = 'first' | 'second' | 'third';

export interface AcademicSession {
  id: string;
  schoolId: string;
  year: string;
  currentTerm: Term;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Score {
  id: string;
  studentId: string;
  subjectId: string;
  term: Term;
  academicYear: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

// Psychometric Skills
export interface PsychometricSkill {
  id: string;
  name: string;
  category: 'affective' | 'psychomotor';
  description?: string;
}

export const DEFAULT_PSYCHOMETRIC_SKILLS: PsychometricSkill[] = [
  { id: 'ps1', name: 'Punctuality', category: 'affective', description: 'Arrives on time regularly' },
  { id: 'ps2', name: 'Attentiveness', category: 'affective', description: 'Pays attention during lessons' },
  { id: 'ps3', name: 'Obedience', category: 'affective', description: 'Follows school rules and instructions' },
  { id: 'ps4', name: 'Resilience', category: 'affective', description: 'Bounces back from setbacks' },
  { id: 'ps5', name: 'Teamwork', category: 'affective', description: 'Cooperates and works well with others' },
  { id: 'ps6', name: 'Neatness', category: 'affective', description: 'Maintains personal hygiene and order' },
  { id: 'ps7', name: 'Honesty', category: 'affective', description: 'Demonstrates truthfulness' },
  { id: 'ps8', name: 'Leadership', category: 'affective', description: 'Shows leadership qualities' },
  { id: 'ps9', name: 'Handwriting', category: 'psychomotor', description: 'Legibility of handwriting' },
  { id: 'ps10', name: 'Drawing/Art', category: 'psychomotor', description: 'Fine motor skills in art' },
  { id: 'ps11', name: 'Sports/Games', category: 'psychomotor', description: 'Physical education performance' },
  { id: 'ps12', name: 'Practical Skills', category: 'psychomotor', description: 'Laboratory and workshop skills' },
];

// Numeric 1-5 scale for psychometric traits
export type PsychometricRating = 1 | 2 | 3 | 4 | 5;

export const PSYCHOMETRIC_RATING_LABELS: Record<number, string> = {
  5: 'Excellent',
  4: 'Very Good',
  3: 'Good',
  2: 'Fair',
  1: 'Poor',
};

export interface PsychometricAssessment {
  id: string;
  studentId: string;
  classId: string;
  term: Term;
  academicYear: string;
  ratings: Record<string, PsychometricRating>;
  createdAt: string;
  updatedAt: string;
}

export interface BehavioralMetric {
  id: string;
  name: string;
  description?: string;
}

export const DEFAULT_BEHAVIORAL_METRICS: BehavioralMetric[] = [
  { id: '1', name: 'Punctuality' },
  { id: '2', name: 'Attentiveness' },
  { id: '3', name: 'Neatness' },
  { id: '4', name: 'Politeness' },
  { id: '5', name: 'Honesty' },
  { id: '6', name: 'Leadership' },
  { id: '7', name: 'Cooperation' },
  { id: '8', name: 'Initiative' },
];

export interface BehavioralAssessment {
  id: string;
  studentId: string;
  term: Term;
  academicYear: string;
  ratings: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface ResultComment {
  id: string;
  studentId: string;
  classId: string;
  term: Term;
  academicYear: string;
  teacherComment: string;
  principalComment?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResultStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';

export interface ClassResult {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  term: Term;
  academicYear: string;
  status: ResultStatus;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  principalNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserRole: UserRole;
  schoolId: string;
  type: 'result_submitted' | 'result_approved' | 'result_rejected' | 'general';
  title: string;
  message: string;
  classId: string;
  className: string;
  term: Term;
  academicYear: string;
  isRead: boolean;
  createdAt: string;
}

export interface StudentResult {
  student: Student;
  scores: Score[];
  behavioralAssessment?: BehavioralAssessment;
  psychometricAssessment?: PsychometricAssessment;
  comment?: ResultComment;
  totalScore: number;
  totalPossible: number;
  percentage: number;
  position: number;
  totalStudents: number;
  classHighest: number;
  classAverage?: number;
  term: Term;
  academicYear: string;
}

export interface AnnualResult {
  student: Student;
  termResults: {
    first?: StudentResult;
    second?: StudentResult;
    third?: StudentResult;
  };
  annualAverages: {
    subjectId: string;
    subjectName: string;
    average: number;
    grade: string;
  }[];
  overallPercentage: number;
  annualPosition: number;
  totalStudents: number;
  academicYear: string;
}

export interface PDFGenerationOptions {
  template: 'classic' | 'modern' | 'hybrid';
  watermark?: string;
  includeSignature?: boolean;
}

export interface BulkPDFJob {
  id: string;
  classId: string;
  term: Term;
  academicYear: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalStudents: number;
  processedStudents: number;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SchoolSignupForm {
  schoolName: string;
  schoolAddress: string;
  schoolEmail: string;
  phoneNumber: string;
  motto?: string;
  logo?: string;
  principalName?: string;
  website?: string;
  state?: string;
  lga?: string;
  schoolType?: 'public' | 'private' | 'mission';
  templateId: 'classic' | 'modern' | 'hybrid';
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface TeacherInviteForm {
  email: string;
  firstName: string;
  lastName: string;
  classId?: string;
}

export interface StudentForm {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  passportPhoto?: File;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
}

export interface SubjectForm {
  name: string;
  code?: string;
  weight: number;
}

export interface ScoreEntryForm {
  studentId: string;
  subjectId: string;
  ca1: number;
  ca2: number;
  exam: number;
}

export interface BehavioralRatingForm {
  studentId: string;
  ratings: Record<string, number>;
}

export interface CommentForm {
  studentId: string;
  teacherComment: string;
  principalComment?: string;
}
export const GRADING_SCALE = DEFAULT_NIGERIAN_GRADING.map((g) => ({
  grade: g.grade,
  min: g.minPercentage,
  max: g.maxPercentage,
  remark: g.remark,
}));
