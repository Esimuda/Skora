import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpsertAttendanceDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsString() @IsNotEmpty() classId: string;
  @IsEnum(['first', 'second', 'third']) term: 'first' | 'second' | 'third';
  @IsString() @IsNotEmpty() academicYear: string;
  @IsNumber() @Min(0) daysSchoolOpened: number;
  @IsNumber() @Min(0) daysPresent: number;
}
