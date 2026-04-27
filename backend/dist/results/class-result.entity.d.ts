export declare class ClassResult {
    id: string;
    classId: string;
    className: string;
    schoolId: string;
    teacherId: string;
    teacherName: string;
    term: 'first' | 'second' | 'third';
    academicYear: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt: Date;
    submittedBy: string;
    approvedAt: Date;
    approvedBy: string;
    principalNote: string;
    rejectedAt: Date | null;
    rejectedBy: string | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
