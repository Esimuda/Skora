import { IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class UpsertScoreDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsString() @IsNotEmpty() subjectId: string;
  @IsString() @IsNotEmpty() classId: string;
  @IsEnum(['first', 'second', 'third']) term: 'first' | 'second' | 'third';
  @IsString() @IsNotEmpty() academicYear: string;
  @IsNumber() @Min(0) @Max(20) ca1: number;
  @IsNumber() @Min(0) @Max(20) ca2: number;
  @IsNumber() @Min(0) @Max(60) exam: number;
}
