import { IsOptional, IsString } from 'class-validator';

export class ApproveResultDto {
  @IsString() @IsOptional() principalNote?: string;
}
