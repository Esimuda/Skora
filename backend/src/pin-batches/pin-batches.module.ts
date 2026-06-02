import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PinBatch } from './pin-batch.entity';
import { ResultPin } from './result-pin.entity';
import { PinUse } from './pin-use.entity';
import { PinGenerator } from './pin-generator';
import { PinBatchesService } from './pin-batches.service';
import { PinBatchesController } from './pin-batches.controller';
import { MailModule } from '../mail/mail.module';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PinBatch, ResultPin, PinUse]),
    MailModule,
    SchoolsModule,
  ],
  providers: [PinGenerator, PinBatchesService],
  controllers: [PinBatchesController],
  exports: [PinBatchesService],
})
export class PinBatchesModule {}