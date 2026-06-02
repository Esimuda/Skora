import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActivateBatchDto {
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @IsString()
  @IsOptional()
  notes?: string;
}