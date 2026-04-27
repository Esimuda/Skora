export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'school_admin' | 'teacher';
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
}
