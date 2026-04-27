import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSchoolDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() address: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phoneNumber: string;
  @IsString() @IsOptional() motto?: string;
  @IsString() @IsOptional() logo?: string;
  @IsString() @IsOptional() principalName?: string;
  @IsString() @IsOptional() website?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() lga?: string;
  @IsEnum(['public', 'private', 'mission']) @IsOptional() schoolType?: 'public' | 'private' | 'mission';
  @IsEnum(['classic', 'modern', 'hybrid']) @IsOptional() templateId?: 'classic' | 'modern' | 'hybrid';
  @IsEnum(['first', 'second', 'third']) @IsOptional() currentTerm?: 'first' | 'second' | 'third';
  @IsString() @IsOptional() currentAcademicYear?: string;
}
