export declare class Score {
    id: string;
    studentId: string;
    subjectId: string;
    classId: string;
    schoolId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    ca1: number;
    ca2: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
    createdAt: Date;
    updatedAt: Date;
}
