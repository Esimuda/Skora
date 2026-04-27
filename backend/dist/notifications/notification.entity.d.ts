export declare class Notification {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserRole: 'admin' | 'school_admin' | 'teacher';
    schoolId: string;
    type: 'result_submitted' | 'result_approved' | 'result_rejected' | 'general';
    title: string;
    message: string;
    classId: string;
    className: string;
    term: string;
    academicYear: string;
    isRead: boolean;
    createdAt: Date;
}
