import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResultsService } from './results.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { ApproveResultDto } from './dto/approve-result.dto';
import { RejectResultDto } from './dto/reject-result.dto';

@ApiTags('Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools/:schoolId/results')
export class ResultsController {
  constructor(private service: ResultsService) {}

  @Post('submit')
  @Roles('teacher')
  submit(
    @Param('schoolId') schoolId: string,
    @Body() dto: SubmitResultDto,
    @CurrentUser() user: any,
  ) {
    return this.service.submit(schoolId, dto, user);
  }

  @Get()
  @Roles('school_admin', 'admin', 'super_admin')
  findAll(
    @Param('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('term') term?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.service.findAll(schoolId, status, term, academicYear);
  }

  @Get(':classId/computed')
  @Roles('school_admin', 'admin', 'super_admin')
  computed(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
    @Request() req: any,
  ) {
    // source=portal means a valid PIN was used — return clean (unwatermarked) data
    // Any other source (principal preview) gets flagged as watermarked
    const isPortal = req.query.source === 'portal';
    const pinUseId = req.query.pinUseId as string | undefined;

    if (!isPortal || !pinUseId) {
      // Return data but flag it so the frontend renders watermark overlays
      return this.service.getComputedResults(schoolId, classId, term, academicYear)
        .then(data => ({ data, watermarked: true }));
    }

    return this.service.getComputedResults(schoolId, classId, term, academicYear)
      .then(data => ({ data, watermarked: false }));
  }

  @Get(':classId/status')
  @Roles('school_admin', 'admin', 'super_admin')
  findOne(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.findOne(schoolId, classId, term, academicYear);
  }

  @Put(':id/approve')
  @Roles('school_admin', 'admin', 'super_admin')
  approve(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: ApproveResultDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approve(schoolId, id, dto, user);
  }

  @Put(':id/reject')
  @Roles('school_admin', 'admin', 'super_admin')
  reject(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: RejectResultDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reject(schoolId, id, dto, user);
  }
}