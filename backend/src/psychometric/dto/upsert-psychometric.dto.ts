import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class UpsertPsychometricDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsString() @IsNotEmpty() classId: string;
  @IsEnum(['first', 'second', 'third']) term: 'first' | 'second' | 'third';
  @IsString() @IsNotEmpty() academicYear: string;
  @IsObject() ratings: Record<string, number>;
}
