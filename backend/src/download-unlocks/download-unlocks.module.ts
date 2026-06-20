import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadUnlock } from './download-unlock.entity';
import { DownloadUnlocksService } from './download-unlocks.service';
import { DownloadUnlocksController } from './download-unlocks.controller';
import { SchoolsModule } from '../schools/schools.module';
import { MailModule } from '../mail/mail.module';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DownloadUnlock, Class, Student]),
    SchoolsModule,
    MailModule,
  ],
  providers: [DownloadUnlocksService],
  controllers: [DownloadUnlocksController],
  exports: [DownloadUnlocksService],
})
export class DownloadUnlocksModule {}
