import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Teacher } from '../teachers/teacher.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class) private repo: Repository<Class>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
    private mail: MailService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  create(schoolId: string, dto: CreateClassDto) {
    return this.repo.save(this.repo.create({ ...dto, schoolId }));
  }

  findAll(schoolId: string) {
    return this.repo.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  // Returns only classes where teacherId matches the requesting user's ID
  findAllForTeacher(schoolId: string, userId: string) {
    return this.repo.find({
      where: { schoolId, teacherId: userId },
      order: { name: 'ASC' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const c = await this.repo.findOne({ where: { id, schoolId } });
    if (!c) throw new NotFoundException('Class not found');
    return c;
  }

  async update(schoolId: string, id: string, dto: UpdateClassDto) {
    const existing = await this.findOne(schoolId, id);
    const previousTeacherId = existing.teacherId;

    await this.repo.update(id, dto);
    const updated = await this.findOne(schoolId, id);

    // Fire assignment email + in-app notification only when a teacher is newly
    // assigned or re-assigned to a different teacher.
    const newTeacherId = dto.teacherId ?? null;
    const teacherChanged = newTeacherId && newTeacherId !== previousTeacherId;

    if (teacherChanged) {
      // Find the teacher record by userId (what teacherId stores on the class)
      const teacher = await this.teacherRepo.findOne({
        where: { userId: newTeacherId, schoolId },
      });

      if (teacher) {
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
        const className = updated.name;
        const teacherName = `${teacher.firstName} ${teacher.lastName}`;

        // 1 — In-app notification (instant, visible in the bell dropdown)
        this.notifications.create({
          fromUserId: schoolId,       // system-generated, use schoolId as sender
          fromUserName: 'Skora RMS',
          toUserRole: 'teacher',
          schoolId,
          type: 'general',
          title: `Class Assigned — ${className}`,
          message: `You have been assigned as the class teacher for ${className} (${updated.academicYear}). You can now enter scores and manage student results.`,
          classId: id,
          className,
          academicYear: updated.academicYear,
          actionUrl: '/teacher/dashboard',
        }).catch(() => { /* non-fatal */ });

        // 2 — Email notification (fire-and-forget)
        this.mail.sendClassAssignmentNotification({
          to: teacher.email,
          teacherName,
          className,
          academicYear: updated.academicYear,
          appUrl: frontendUrl,
        }).catch(() => { /* non-fatal */ });
      }
    }

    return updated;
  }

  async remove(schoolId: string, id: string) {
    const c = await this.findOne(schoolId, id);
    await this.repo.remove(c);
  }

  async incrementStudentCount(classId: string, delta: number) {
    await this.repo.increment({ id: classId }, 'studentCount', delta);
  }
}