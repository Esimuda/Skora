import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Class } from './class.entity';
import { Teacher } from '../teachers/teacher.entity';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, Teacher]),
    ConfigModule,
    NotificationsModule,
  ],
  providers: [ClassesService],
  controllers: [ClassesController],
  exports: [ClassesService],
})
export class ClassesModule {}