export declare class UpsertScoreDto {
    studentId: string;
    subjectId: string;
    classId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    ca1: number;
    ca2: number;
    exam: number;
}
