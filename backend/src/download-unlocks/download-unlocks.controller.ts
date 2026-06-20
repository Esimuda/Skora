import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DownloadUnlocksService } from './download-unlocks.service';
import { RequestDownloadUnlockDto } from './dto/request-download-unlock.dto';
import { ActivateDownloadUnlockDto } from './dto/activate-download-unlock.dto';

@ApiTags('Download Unlocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DownloadUnlocksController {
  constructor(private service: DownloadUnlocksService) {}

  // ── Principal routes ───────────────────────────────────────────────────────

  @Post('schools/:schoolId/download-unlocks')
  @Roles('school_admin')
  requestUnlock(
    @Param('schoolId') schoolId: string,
    @Body() dto: RequestDownloadUnlockDto,
    @CurrentUser() user: any,
  ) {
    return this.service.requestUnlock(schoolId, dto, user);
  }

  @Get('schools/:schoolId/download-unlocks')
  @Roles('school_admin', 'admin', 'super_admin')
  getBySchool(@Param('schoolId') schoolId: string) {
    return this.service.findBySchool(schoolId);
  }

  // Returns the unlock record if active, or null. Frontend uses this to
  // decide whether to show download or request-unlock UI.
  @Get('schools/:schoolId/download-unlocks/check')
  @Roles('school_admin', 'admin', 'super_admin')
  checkUnlock(
    @Param('schoolId') schoolId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
    @Query('scope') scope: 'class' | 'school',
    @Query('classId') classId?: string,
  ) {
    return this.service.checkUnlock(schoolId, term, academicYear, scope, classId);
  }

  // ── Super Admin route ──────────────────────────────────────────────────────

  @Put('admin/download-unlocks/:unlockId/activate')
  @Roles('super_admin')
  activateUnlock(
    @Param('unlockId') unlockId: string,
    @Body() dto: ActivateDownloadUnlockDto,
    @CurrentUser() user: any,
  ) {
    return this.service.activateUnlock(unlockId, dto, user);
  }
}
