import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PayoutsService } from './payouts.service';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

class CreatePayoutDto {
  @IsUUID() schoolId!: string;
  @IsNumber() @Min(1) amount!: number;
  @IsString() @IsOptional() bankName?: string;
  @IsString() @IsOptional() accountNumber?: string;
  @IsString() @IsOptional() accountName?: string;
  @IsString() @IsNotEmpty() reference!: string;
  @IsString() @IsOptional() notes?: string;
}

@ApiTags('Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/payouts')
export class PayoutsController {
  constructor(private service: PayoutsService) {}

  @Post()
  @Roles('super_admin')
  create(@Body() dto: CreatePayoutDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles('super_admin')
  findAll() {
    return this.service.findAll();
  }

  @Get('schools/:schoolId')
  @Roles('super_admin', 'school_admin')
  findBySchool(@Param('schoolId') schoolId: string) {
    return this.service.findBySchool(schoolId);
  }
}