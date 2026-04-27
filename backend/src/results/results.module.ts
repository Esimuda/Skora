import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassResult } from './class-result.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { ClassesModule } from '../classes/classes.module';
import { StudentsModule } from '../students/students.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { ScoresModule } from '../scores/scores.module';
import { PsychometricModule } from '../psychometric/psychometric.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeachersModule } from '../teachers/teachers.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassResult]),
    ClassesModule,
    StudentsModule,
    SubjectsModule,
    ScoresModule,
    PsychometricModule,
    CommentsModule,
    NotificationsModule,
    TeachersModule,
    UsersModule,
  ],
  providers: [ResultsService],
  controllers: [ResultsController],
  exports: [ResultsService],
})
export class ResultsModule {}
