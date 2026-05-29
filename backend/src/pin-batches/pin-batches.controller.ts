import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PinBatchesService } from './pin-batches.service';
import { RequestBatchDto } from './dto/request-batch.dto';
import { ActivateBatchDto } from './dto/activate-batch.dto';

@ApiTags('Pin Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PinBatchesController {
  constructor(private service: PinBatchesService) {}

  // ── Principal routes ──────────────────────────────────────────────────────

  @Post('schools/:schoolId/batches')
  @Roles('school_admin', 'admin', 'super_admin')
  requestBatch(
    @Param('schoolId') schoolId: string,
    @Body() dto: RequestBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.requestBatch(schoolId, dto, user);
  }

  @Get('schools/:schoolId/batches')
  @Roles('school_admin', 'admin', 'super_admin')
  getBatchesBySchool(@Param('schoolId') schoolId: string) {
    return this.service.findBySchool(schoolId);
  }

  @Get('schools/:schoolId/batches/stats')
  @Roles('school_admin', 'admin', 'super_admin')
  getBatchStats(
    @Param('schoolId') schoolId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.getBatchStats(schoolId, term, academicYear);
  }

  @Get('schools/:schoolId/batches/:batchId/pins')
  @Roles('school_admin', 'admin', 'super_admin')
  getRawPins(
    @Param('schoolId') schoolId: string,
    @Param('batchId') batchId: string,
  ) {
    return this.service.getRawPinsForBatch(batchId, schoolId);
  }

  // ── Super Admin routes ────────────────────────────────────────────────────

  @Put('admin/batches/:batchId/activate')
  @Roles('super_admin')
  activateBatch(
    @Param('batchId') batchId: string,
    @Body() dto: ActivateBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.activateBatch(batchId, dto, user);
  }
}