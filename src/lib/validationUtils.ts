import { localStorageService } from './localStorage';

export interface ValidationIssue {
  type: 'scores' | 'behavioral' | 'comments';
  studentId: string;
  studentName: string;
  details: string;
  fixRoute: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    totalStudents: number;
    missingScores: number;
    missingBehavioral: number;
    missingComments: number;
  };
}

/**
 * Validate if class is ready for submission
 */
export function validateClassSubmission(classId: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Get all students for this class
  const studentsData = localStorageService.get<any[]>(`students_${classId}`) || [];
  const students = studentsData;

  // Get all subjects for this class
  const subjectsData = localStorageService.get<any[]>(`subjects_${classId}`) || [];
  const subjects = subjectsData;

  let missingScoresCount = 0;
  let missingBehavioralCount = 0;
  let missingCommentsCount = 0;

  students.forEach((student) => {
    const studentName = `${student.lastName} ${student.firstName}`.toUpperCase();

    // Check scores for each subject
    subjects.forEach((subject) => {
      const scoreKey = `scores_${classId}_${subject.id}_${student.id}`;
      const scoreData = localStorageService.get<any>(scoreKey);

      if (!scoreData || 
          scoreData.ca1 === undefined || scoreData.ca1 === null || scoreData.ca1 === '' ||
          scoreData.ca2 === undefined || scoreData.ca2 === null || scoreData.ca2 === '' ||
          scoreData.exam === undefined || scoreData.exam === null || scoreData.exam === '') {
        
        missingScoresCount++;
        issues.push({
          type: 'scores',
          studentId: student.id,
          studentName,
          details: `Missing scores in ${subject.name.toUpperCase()}`,
          fixRoute: '/teacher/scores',
        });
      }
    });

    // Check behavioral assessment
    const behavioralData = localStorageService.getBehavioral(classId, student.id) as { ratings?: Record<string, unknown> } | null;
    if (!behavioralData || !behavioralData.ratings) {
      missingBehavioralCount++;
      issues.push({
        type: 'behavioral',
        studentId: student.id,
        studentName,
        details: 'Missing behavioral ratings (8 metrics required)',
        fixRoute: '/teacher/scores', // Behavioral is in scores page
      });
    } else {
      // Check if all 8 metrics are rated
      const metrics = ['punctuality', 'attentiveness', 'neatness', 'politeness', 'honesty', 'leadership', 'cooperation', 'initiative'];
      const missingMetrics = metrics.filter(metric => !behavioralData?.ratings?.[metric]);
      
      if (missingMetrics.length > 0) {
        missingBehavioralCount++;
        issues.push({
          type: 'behavioral',
          studentId: student.id,
          studentName,
          details: `Missing ${missingMetrics.length} behavioral metric(s)`,
          fixRoute: '/teacher/scores',
        });
      }
    }

    // Check teacher comment
    const commentData = localStorageService.getComment(classId, student.id, 'teacher');
    if (!commentData || !commentData.comment || commentData.comment.trim() === '') {
      missingCommentsCount++;
      issues.push({
        type: 'comments',
        studentId: student.id,
        studentName,
        details: 'Missing teacher comment',
        fixRoute: '/teacher/comments',
      });
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    summary: {
      totalStudents: students.length,
      missingScores: missingScoresCount,
      missingBehavioral: missingBehavioralCount,
      missingComments: missingCommentsCount,
    },
  };
}

/**
 * Get detailed validation message
 */
export function getValidationMessage(result: ValidationResult): string {
  if (result.isValid) {
    return 'All requirements met! Ready to submit.';
  }

  const { summary } = result;
  const messages: string[] = [];

  if (summary.missingScores > 0) {
    messages.push(`${summary.missingScores} score(s) incomplete`);
  }
  if (summary.missingBehavioral > 0) {
    messages.push(`${summary.missingBehavioral} behavioral rating(s) missing`);
  }
  if (summary.missingComments > 0) {
    messages.push(`${summary.missingComments} comment(s) missing`);
  }

  return messages.join(', ');
}

/**
 * Group validation issues by type
 */
export function groupIssuesByType(issues: ValidationIssue[]): {
  scores: ValidationIssue[];
  behavioral: ValidationIssue[];
  comments: ValidationIssue[];
} {
  return {
    scores: issues.filter(i => i.type === 'scores'),
    behavioral: issues.filter(i => i.type === 'behavioral'),
    comments: issues.filter(i => i.type === 'comments'),
  };
}

/**
 * Check if student data is complete
 */
export function isStudentComplete(
  studentId: string,
  classId: string,
  subjectIds: string[]
): boolean {
  // Check all scores
  for (const subjectId of subjectIds) {
    const scoreKey = `scores_${classId}_${subjectId}_${studentId}`;
    const scoreData = localStorageService.get<any>(scoreKey);
    
    if (!scoreData || 
        scoreData.ca1 === undefined || 
        scoreData.ca2 === undefined || 
        scoreData.exam === undefined) {
      return false;
    }
  }

  // Check behavioral
  const behavioralData = localStorageService.getBehavioral(classId, studentId) as { ratings?: Record<string, unknown> } | null;
  if (!behavioralData || !behavioralData.ratings) {
    return false;
  }

  // Check all 8 metrics
  const metrics = ['punctuality', 'attentiveness', 'neatness', 'politeness', 'honesty', 'leadership', 'cooperation', 'initiative'];
  for (const metric of metrics) {
    if (!behavioralData.ratings[metric]) {
      return false;
    }
  }

  // Check comment
  const commentData = localStorageService.getComment(classId, studentId, 'teacher');
  if (!commentData || !commentData.comment || commentData.comment.trim() === '') {
    return false;
  }

  return true;
}

/**
 * Get completion percentage for class
 */
export function getClassCompletionPercentage(classId: string): number {
  const studentsData = localStorageService.get<any[]>(`students_${classId}`) || [];
  const subjectsData = localStorageService.get<any[]>(`subjects_${classId}`) || [];
  
  if (studentsData.length === 0) return 0;

  const subjectIds = subjectsData.map(s => s.id);
  const completeStudents = studentsData.filter(student => 
    isStudentComplete(student.id, classId, subjectIds)
  );

  return Math.round((completeStudents.length / studentsData.length) * 100);
}

/**
 * Get readable issue count
 */
export function getIssueCountText(issues: ValidationIssue[]): string {
  const count = issues.length;
  if (count === 0) return 'No issues';
  if (count === 1) return '1 issue';
  return `${count} issues`;
}
