import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/classes/:classId/students')
export class StudentsController {
  constructor(private service: StudentsService) {}

  @Post()
  create(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.service.create(schoolId, classId, dto);
  }

  @Get()
  findAll(@Param('schoolId') schoolId: string, @Param('classId') classId: string) {
    return this.service.findByClass(schoolId, classId);
  }

  @Get(':id')
  findOne(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.findOne(schoolId, id);
  }

  @Put(':id')
  @Patch(':id')
  update(@Param('schoolId') schoolId: string, @Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(schoolId, id, dto);
  }

  @Delete(':id')
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.service.remove(schoolId, id);
  }
}
