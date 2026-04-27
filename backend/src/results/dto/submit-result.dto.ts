import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitResultDto {
  @IsString() @IsNotEmpty() classId: string;
  @IsEnum(['first', 'second', 'third']) term: 'first' | 'second' | 'third';
  @IsString() @IsNotEmpty() academicYear: string;
  @IsString() @IsOptional() message?: string;
}
