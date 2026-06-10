import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString() @IsOptional() admissionNumber?: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsOptional() middleName?: string;
  @IsString() @IsOptional() dateOfBirth?: string;
  @IsEnum(['male', 'female']) gender: 'male' | 'female';
  @IsString() @IsOptional() parentName?: string;
  @IsString() @IsOptional() parentPhone?: string;
  @IsString() @IsOptional() parentEmail?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() photoUrl?: string;
}