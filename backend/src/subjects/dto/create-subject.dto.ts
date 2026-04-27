import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSubjectDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() code?: string;
  @IsNumber() @Min(0) @Max(1) @IsOptional() weight?: number;
}
