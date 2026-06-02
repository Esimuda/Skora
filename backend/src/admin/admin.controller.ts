import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PinBatchesService } from '../pin-batches/pin-batches.service';
import { SchoolsService } from '../schools/schools.service';
import { PayoutsService } from '../payouts/payouts.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('admin')
export class AdminController {
  constructor(
    private batches: PinBatchesService,
    private schools: SchoolsService,
    private payouts: PayoutsService,
  ) {}

  // Platform-wide summary stats for admin dashboard
  @Get('stats')
  async getStats() {
    const [allSchools, batchSummary] = await Promise.all([
      this.schools.findAll(),
      this.batches.getSummary(),
    ]);

    return {
      totalSchools: allSchools.length,
      activeSchools: allSchools.length,
      pendingBatches: batchSummary.pending,
      totalPinsIssued: batchSummary.totalPinsIssued,
      totalPinsUsed: batchSummary.totalPinsUsed,
      estimatedRevenue: batchSummary.totalPinsIssued * 1000,
    };
  }

  // Recent activity feed for admin dashboard
  @Get('activity')
  async getActivity() {
    const [schools, batches] = await Promise.all([
      this.schools.findAll(),
      this.batches.findAll(),
    ]);

    const activity: { type: string; message: string; date: Date }[] = [];

    for (const school of (schools as any[]).slice(0, 10)) {
      activity.push({
        type: 'school_registered',
        message: `New school registered: ${school.name}`,
        date: school.createdAt,
      });
    }

    for (const batch of (batches as any[]).slice(0, 10)) {
      if (batch.status === 'pending_payment') {
        activity.push({
          type: 'batch_requested',
          message: `${batch.schoolName} requested ${batch.quantity} cards — ₦${batch.totalAmount.toLocaleString()} pending`,
          date: batch.requestedAt,
        });
      } else if (batch.status === 'active') {
        activity.push({
          type: 'batch_activated',
          message: `${batch.schoolName} batch activated — ${batch.quantity} PINs released`,
          date: batch.activatedAt ?? batch.requestedAt,
        });
      }
    }

    return activity
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }

  // Single school detail — profile + stats + full batch history
  @Get('schools/:schoolId')
  async getSchoolDetail(@Param('schoolId') schoolId: string) {
    const [school, batches] = await Promise.all([
      this.schools.findOneWithStats(schoolId),
      this.batches.findBySchool(schoolId),
    ]);
    return { school, batches };
  }

  @Get('batches')
  getAllBatches() {
    return this.batches.findAll();
  }

  @Get('batches/summary')
  getBatchSummary() {
    return this.batches.getSummary();
  }

  @Get('revenue')
  getRevenue() {
    return this.batches.getRevenueBreakdown();
  }

  @Get('payouts')
  getPayouts() {
    return this.payouts.findAll();
  }
}
