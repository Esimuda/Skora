import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubjectsService, UpdateSubjectDto } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/classes/:classId/subjects')
export class SubjectsController {
  constructor(private service: SubjectsService) {}

  @Post()
  create(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.service.create(schoolId, classId, dto);
  }

  @Get()
  findAll(@Param('schoolId') schoolId: string, @Param('classId') classId: string) {
    return this.service.findAll(schoolId, classId);
  }

  @Put(':id')
  update(@Param('schoolId') schoolId: string, @Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.service.update(schoolId, id, dto);
  }

  @Delete(':id')
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.remove(schoolId, id);
  }
}
