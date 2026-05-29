import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RequestBatchDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;
}