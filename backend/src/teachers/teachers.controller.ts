import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TeachersService } from './teachers.service';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools/:schoolId/teachers')
export class TeachersController {
  constructor(private service: TeachersService) {}

  @Post('invite')
  @Roles('school_admin', 'admin')
  invite(@Param('schoolId') schoolId: string, @Body() dto: InviteTeacherDto, @CurrentUser() user: any) {
    return this.service.invite(schoolId, dto, user);
  }

  @Get()
  @Roles('school_admin', 'admin')
  findAll(@Param('schoolId') schoolId: string) {
    return this.service.findAll(schoolId);
  }

  @Get(':id')
  findOne(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.findOne(schoolId, id);
  }

  @Put(':id')
  @Roles('school_admin', 'admin')
  update(@Param('schoolId') schoolId: string, @Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.service.update(schoolId, id, dto);
  }

  @Post(':id/activate')
  @Roles('school_admin', 'admin')
  activate(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.activate(schoolId, id);
  }

  @Post(':id/deactivate')
  @Roles('school_admin', 'admin')
  deactivate(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.deactivate(schoolId, id);
  }

  @Delete(':id')
  @Roles('school_admin', 'admin')
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.remove(schoolId, id);
  }
}
