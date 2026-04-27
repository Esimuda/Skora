import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@ApiTags('Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private service: SchoolsService) {}

  @Post()
  @Roles('admin', 'school_admin')
  create(@Body() dto: CreateSchoolDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.service.assertSchoolAccess(id, user);
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('school_admin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateSchoolDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }
}
