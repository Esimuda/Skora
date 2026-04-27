export declare class School {
    id: string;
    name: string;
    address: string;
    email: string;
    phoneNumber: string;
    motto: string;
    logo: string;
    principalName: string;
    website: string;
    state: string;
    lga: string;
    schoolType: 'public' | 'private' | 'mission';
    templateId: 'classic' | 'modern' | 'hybrid';
    currentTerm: 'first' | 'second' | 'third';
    currentAcademicYear: string;
    createdAt: Date;
    updatedAt: Date;
}
