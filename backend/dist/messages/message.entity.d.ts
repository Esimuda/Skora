export declare class Message {
    id: string;
    schoolId: string;
    senderId: string;
    senderName: string;
    senderRole: 'admin' | 'school_admin' | 'teacher';
    recipientId: string;
    recipientName: string;
    recipientRole: 'admin' | 'school_admin' | 'teacher';
    content: string;
    classId: string;
    className: string;
    isRead: boolean;
    createdAt: Date;
}
