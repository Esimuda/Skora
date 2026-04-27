import { IsNotEmpty, IsString } from 'class-validator';

export class RejectResultDto {
  @IsString() @IsNotEmpty() rejectionReason: string;
}
