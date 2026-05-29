import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ScoresModule } from './scores/scores.module';
import { ResultsModule } from './results/results.module';
import { CommentsModule } from './comments/comments.module';
import { PsychometricModule } from './psychometric/psychometric.module';
import { AttendanceModule } from './attendance/attendance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { MailModule } from './mail/mail.module';
import { PinBatchesModule } from './pin-batches/pin-batches.module';
import { PayoutsModule } from './payouts/payouts.module';
import { AdminModule } from './admin/admin.module';
import { PortalModule } from './portal/portal.module';

@Module({
  imports: [
    // Config — global so ConfigService is available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — protects portal PIN validation endpoint
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour in milliseconds
        limit: 5,     // max 5 PIN attempts per IP per hour
      },
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // Core modules
    AuthModule,
    UsersModule,
    SchoolsModule,
    TeachersModule,
    ClassesModule,
    StudentsModule,
    SubjectsModule,
    ScoresModule,
    ResultsModule,
    CommentsModule,
    PsychometricModule,
    AttendanceModule,
    NotificationsModule,
    MessagesModule,
    MailModule,

    // New modules
    PinBatchesModule,
    PayoutsModule,
    AdminModule,
    PortalModule,
  ],
})
export class AppModule {}