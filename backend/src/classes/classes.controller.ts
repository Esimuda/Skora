import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
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
  findAll(@Param('schoolId') schoolId: string) {
    return this.service.findAll(schoolId);
  }

  @Get(':id')
  findOne(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.findOne(schoolId, id);
  }

  @Put(':id')
  @Patch(':id')
  @Roles('school_admin', 'admin')
  update(@Param('schoolId') schoolId: string, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.service.update(schoolId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'admin')
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.remove(schoolId, id);
  }
}
