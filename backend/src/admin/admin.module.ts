import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PinBatchesModule } from '../pin-batches/pin-batches.module';
import { SchoolsModule } from '../schools/schools.module';
import { PayoutsModule } from '../payouts/payouts.module';
import { DownloadUnlocksModule } from '../download-unlocks/download-unlocks.module';

@Module({
  imports: [PinBatchesModule, SchoolsModule, PayoutsModule, DownloadUnlocksModule],
  controllers: [AdminController],
})
export class AdminModule {}