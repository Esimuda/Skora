import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActivateDownloadUnlockDto {
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
