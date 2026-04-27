import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { UpsertCommentDto } from './dto/upsert-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/comments')
export class CommentsController {
  constructor(private service: CommentsService) {}

  @Post()
  upsert(@Param('schoolId') schoolId: string, @Body() dto: UpsertCommentDto) {
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
