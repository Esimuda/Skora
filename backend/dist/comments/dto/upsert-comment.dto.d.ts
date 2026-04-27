export declare class UpsertCommentDto {
    studentId: string;
    classId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    teacherComment?: string;
    principalComment?: string;
}
