import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsychometricAssessment } from './psychometric-assessment.entity';
import { PsychometricService } from './psychometric.service';
import { PsychometricController } from './psychometric.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PsychometricAssessment])],
  providers: [PsychometricService],
  controllers: [PsychometricController],
  exports: [PsychometricService],
})
export class PsychometricModule {}
