import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools/:schoolId/classes')
export class ClassesController {
  constructor(private service: ClassesService) {}

  @Post()
  @Roles('school_admin', 'admin')
  create(@Param('schoolId') schoolId: string, @Body() dto: CreateClassDto) {
    return this.service.create(schoolId, dto);
  }

  @Get()
  findAll(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: any,
  ) {
    // Teachers only see classes assigned to them
    if (user?.role === 'teacher') {
      return this.service.findAllForTeacher(schoolId, user.id);
    }
    return this.service.findAll(schoolId);
  }

  @Get(':id')
  findOne(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.findOne(schoolId, id);
  }

  // NestJS can't stack two HTTP method decorators on a single handler — the
  // second one silently overwrites the first. Register PUT and PATCH as
  // separate handlers that both delegate to the same service method.
  @Patch(':id')
  @Roles('school_admin', 'admin')
  update(@Param('schoolId') schoolId: string, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.service.update(schoolId, id, dto);
  }

  @Put(':id')
  @Roles('school_admin', 'admin')
  replace(@Param('schoolId') schoolId: string, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.service.update(schoolId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('school_admin', 'admin')
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.remove(schoolId, id);
  }
}