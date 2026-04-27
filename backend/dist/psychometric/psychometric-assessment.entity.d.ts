export declare class PsychometricAssessment {
    id: string;
    studentId: string;
    classId: string;
    schoolId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    ratings: Record<string, number>;
    createdAt: Date;
    updatedAt: Date;
}
