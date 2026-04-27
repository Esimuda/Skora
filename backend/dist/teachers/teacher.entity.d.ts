export declare class Teacher {
    id: string;
    userId: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    classes: string[];
    status: 'pending' | 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}
