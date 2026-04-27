import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InviteTeacherDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsOptional() phoneNumber?: string;
  @IsString() @IsOptional() temporaryPassword?: string;
}
