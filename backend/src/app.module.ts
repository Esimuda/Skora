import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ScoresModule } from './scores/scores.module';
import { PsychometricModule } from './psychometric/psychometric.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CommentsModule } from './comments/comments.module';
import { ResultsModule } from './results/results.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'skora_rms'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    SchoolsModule,
    TeachersModule,
    ClassesModule,
    StudentsModule,
    SubjectsModule,
    ScoresModule,
    PsychometricModule,
    AttendanceModule,
    CommentsModule,
    ResultsModule,
    NotificationsModule,
    MessagesModule,
    MailModule,
  ],
})
export class AppModule {}
