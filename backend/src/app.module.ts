import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Rate limiting ──────────────────────────────────────────────────────────
    // 300 requests per minute per IP — generous for real-time score saving,
    // tight enough to prevent DoS. Auth endpoints get tighter limits via decorator.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // 1 minute window
        limit: 300,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,     // 10 login/register attempts per minute
      },
    ]),

    // ── Database ───────────────────────────────────────────────────────────────
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
        // synchronize is safe in dev; in production use `npm run migration:run`
        synchronize: config.get('NODE_ENV') !== 'production',
        ssl: { rejectUnauthorized: false },
        logging: config.get('NODE_ENV') === 'development',
        migrationsRun: config.get('NODE_ENV') === 'production',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsTableName: 'typeorm_migrations',

        // ── Connection pool tuning for 5 000 concurrent users ──────────────────
        // Each NestJS instance holds at most 20 PG connections.
        // Supabase transaction pooler supports many connections → scale horizontally.
        extra: {
          max: 20,               // max pool connections per instance
          min: 2,                // keep 2 warm at all times
          idleTimeoutMillis: 30_000,   // drop idle connections after 30s
          connectionTimeoutMillis: 10_000, // fail fast if pool is exhausted
          statement_timeout: 30_000,   // kill runaway queries after 30s
        },
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
    HealthModule,
  ],

  providers: [
    // Apply rate limiting globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
