import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ScoresService } from './scores.service';
import { UpsertScoreDto } from './dto/upsert-score.dto';
import { UpsertScoresBulkDto } from './dto/upsert-scores-bulk.dto';

@ApiTags('Scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/scores')
export class ScoresController {
  constructor(private service: ScoresService) {}

  @Post()
  upsert(@Param('schoolId') schoolId: string, @Body() dto: UpsertScoreDto) {
    return this.service.upsert(schoolId, dto);
  }

  @Post('bulk')
  upsertBulk(@Param('schoolId') schoolId: string, @Body() dto: UpsertScoresBulkDto) {
    return this.service.upsertBulk(schoolId, dto.scores);
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

  @Get('by-subject/:classId/:subjectId')
  bySubject(
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.findBySubject(classId, subjectId, term, academicYear);
  }
}
