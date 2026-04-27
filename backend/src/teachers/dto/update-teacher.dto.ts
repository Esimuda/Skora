import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTeacherDto {
  @IsString() @IsOptional() phoneNumber?: string;
  @IsArray() @IsOptional() classes?: string[];
  @IsEnum(['pending', 'active', 'inactive']) @IsOptional() status?: 'pending' | 'active' | 'inactive';
}
