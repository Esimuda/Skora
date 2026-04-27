export declare class CreateStudentDto {
    admissionNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: string;
    gender: 'male' | 'female';
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    address?: string;
}
