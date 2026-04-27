export declare class UpsertPsychometricDto {
    studentId: string;
    classId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    ratings: Record<string, number>;
}
