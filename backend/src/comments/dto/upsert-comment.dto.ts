import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertCommentDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsString() @IsNotEmpty() classId: string;
  @IsEnum(['first', 'second', 'third']) term: 'first' | 'second' | 'third';
  @IsString() @IsNotEmpty() academicYear: string;
  @IsString() @IsOptional() teacherComment?: string;
  @IsString() @IsOptional() principalComment?: string;
}
