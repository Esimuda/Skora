import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() academicYear: string;
  @IsString() @IsOptional() section?: string;
  @IsString() @IsOptional() level?: string;
  @IsString() @IsOptional() teacherId?: string;
  @IsString() @IsOptional() teacherName?: string;
}
