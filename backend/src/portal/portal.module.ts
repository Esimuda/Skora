import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { SchoolsModule } from '../schools/schools.module';
import { StudentsModule } from '../students/students.module';
import { ClassesModule } from '../classes/classes.module';
import { ResultsModule } from '../results/results.module';
import { PinBatchesModule } from '../pin-batches/pin-batches.module';

@Module({
  imports: [
    SchoolsModule,
    StudentsModule,
    ClassesModule,
    ResultsModule,
    PinBatchesModule,
  ],
  controllers: [PortalController],
})
export class PortalModule {}