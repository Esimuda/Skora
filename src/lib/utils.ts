import { Score, GradingScale, Student, DEFAULT_NIGERIAN_GRADING } from '@/types';

/**
 * Nigerian School Terms with Official Dates
 */
export const NIGERIAN_TERMS = {
  first: {
    name: 'First Term',
    startDate: 'September 16',
    endDate: 'December 15',
    startMonth: 8, // September (0-indexed)
    endMonth: 11, // December
  },
  second: {
    name: 'Second Term',
    startDate: 'January 8',
    endDate: 'April 12',
    startMonth: 0, // January
    endMonth: 3, // April
  },
  third: {
    name: 'Third Term',
    startDate: 'April 29',
    endDate: 'July 26',
    startMonth: 4, // May
    endMonth: 6, // July
  },
} as const;

/**
 * Get current Nigerian school term based on today's date
 */
export function getCurrentNigerianTerm(): 'first' | 'second' | 'third' {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  // First Term: Sept 16 - Dec 15
  if (month === 8 && day >= 16) return 'first';
  if (month >= 9 && month <= 11) return 'first';
  if (month === 11 && day <= 15) return 'first';

  // Second Term: Jan 8 - Apr 12
  if (month === 0 && day >= 8) return 'second';
  if (month >= 1 && month <= 3) return 'second';
  if (month === 3 && day <= 12) return 'second';

  // Third Term: Apr 29 - Jul 26
  if (month === 3 && day >= 29) return 'third';
  if (month >= 4 && month <= 6) return 'third';
  if (month === 6 && day <= 26) return 'third';

  // Default fallback
  return 'first';
}

/**
 * Get term dates for display
 */
export function getTermDates(term: 'first' | 'second' | 'third'): string {
  const termData = NIGERIAN_TERMS[term];
  return `${termData.startDate} - ${termData.endDate}`;
}

/**
 * Get full term display name
 */
export function getTermName(term: 'first' | 'second' | 'third'): string {
  return NIGERIAN_TERMS[term].name;
}

/**
 * Format text to UPPERCASE (Nigerian style)
 */
export function toNigerianUpperCase(text: string): string {
  return text.toUpperCase();
}

/**
 * Format student name in UPPERCASE
 */
export function formatStudentName(firstName: string, lastName: string, middleName?: string): string {
  const parts = [lastName, firstName, middleName].filter(Boolean);
  return parts.join(' ').toUpperCase();
}

/**
 * Format full name
 */
export function formatFullName(firstName: string, lastName: string, middleName?: string): string {
  return formatStudentName(firstName, lastName, middleName);
}

/**
 * Calculate total score (CA1 + CA2 + Exam)
 */
export function calculateTotalScore(ca1: number, ca2: number, exam: number): number {
  return ca1 + ca2 + exam;
}

/**
 * Get grade info based on percentage
 */
export function getGradeInfo(
  percentage: number,
  gradingScale: GradingScale | null = null
): { grade: string; remark: string } {
  const scale: Omit<GradingScale, 'id' | 'schoolId'>[] = gradingScale
    ? DEFAULT_NIGERIAN_GRADING
    : DEFAULT_NIGERIAN_GRADING;

  for (const gradeInfo of scale) {
    if (percentage >= gradeInfo.minPercentage && percentage <= gradeInfo.maxPercentage) {
      return {
        grade: gradeInfo.grade,
        remark: gradeInfo.remark,
      };
    }
  }

  return { grade: 'F9', remark: 'Fail' };
}

/**
 * Calculate rankings/positions for students
 */
export function calculateRankings(
  students: { studentId: string; percentage: number }[]
): { studentId: string; position: number }[] {
  // Sort by percentage descending
  const sorted = [...students].sort((a, b) => b.percentage - a.percentage);

  const rankings: { studentId: string; position: number }[] = [];
  let currentPosition = 1;

  for (let i = 0; i < sorted.length; i++) {
    // Handle ties
    if (i > 0 && sorted[i].percentage === sorted[i - 1].percentage) {
      rankings.push({
        studentId: sorted[i].studentId,
        position: rankings[i - 1].position, // Same position as previous
      });
    } else {
      rankings.push({
        studentId: sorted[i].studentId,
        position: currentPosition,
      });
    }
    currentPosition++;
  }

  return rankings;
}

/**
 * Format position (1st, 2nd, 3rd, etc.)
 */
export function formatPosition(position: number): string {
  if (position === 1) return '1ST';
  if (position === 2) return '2ND';
  if (position === 3) return '3RD';
  return `${position}TH`;
}

/**
 * Get behavioral rating label
 */
export function getBehavioralRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    5: 'EXCELLENT',
    4: 'VERY GOOD',
    3: 'GOOD',
    2: 'FAIR',
    1: 'NEEDS IMPROVEMENT',
  };
  return labels[rating] || 'N/A';
}

/**
 * Calculate average behavioral rating
 */
export function calculateAverageBehavioral(ratings: Record<string, number>): number {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Debounce function for auto-save
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get academic year string
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Academic year starts in September
  if (month >= 8) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  // Accepts: +234XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXXX
  const phoneRegex = /^(\+234|0)?[789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Check if scores are complete
 */
export function areScoresComplete(score: Partial<Score>): boolean {
  return (
    score.ca1 !== undefined &&
    score.ca1 !== null &&
    score.ca2 !== undefined &&
    score.ca2 !== null &&
    score.exam !== undefined &&
    score.exam !== null
  );
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Class name helper for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
