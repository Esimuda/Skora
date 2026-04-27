export declare class UpsertAttendanceDto {
    studentId: string;
    classId: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    daysSchoolOpened: number;
    daysPresent: number;
}
