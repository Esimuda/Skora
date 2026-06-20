import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RequestDownloadUnlockDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsEnum(['class', 'school'])
  scope: 'class' | 'school';

  // Required when scope = 'class'
  @IsUUID()
  @IsOptional()
  classId?: string;
}
