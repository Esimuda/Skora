import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PsychometricService } from './psychometric.service';
import { UpsertPsychometricDto } from './dto/upsert-psychometric.dto';

@ApiTags('Psychometric')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/psychometric')
export class PsychometricController {
  constructor(private service: PsychometricService) {}

  @Get('skills')
  getSkills() {
    return this.service.getSkills();
  }

  @Post()
  upsert(@Param('schoolId') schoolId: string, @Body() dto: UpsertPsychometricDto) {
    return this.service.upsert(schoolId, dto);
  }

  @Get('by-class/:classId')
  byClass(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.findByClass(schoolId, classId, term, academicYear);
  }

  @Get('by-student/:studentId')
  byStudent(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.findByStudent(schoolId, studentId, term, academicYear);
  }
}
