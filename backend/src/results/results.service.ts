import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassResult } from './class-result.entity';
import { SubmitResultDto } from './dto/submit-result.dto';
import { ApproveResultDto } from './dto/approve-result.dto';
import { RejectResultDto } from './dto/reject-result.dto';
import { ClassesService } from '../classes/classes.service';
import { StudentsService } from '../students/students.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ScoresService } from '../scores/scores.service';
import { PsychometricService } from '../psychometric/psychometric.service';
import { CommentsService } from '../comments/comments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TeachersService } from '../teachers/teachers.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(ClassResult) private repo: Repository<ClassResult>,
    private classes: ClassesService,
    private students: StudentsService,
    private subjects: SubjectsService,
    private scores: ScoresService,
    private psychometric: PsychometricService,
    private comments: CommentsService,
    private notifications: NotificationsService,
    private teachers: TeachersService,
    private mail: MailService,
    private users: UsersService,
  ) {}

  async submit(schoolId: string, dto: SubmitResultDto, teacherUser: any) {
    const cls = await this.classes.findOne(schoolId, dto.classId);

    const studentList = await this.students.findByClass(schoolId, dto.classId);
    const subjectList = await this.subjects.findAll(schoolId, dto.classId);

    if (studentList.length === 0) throw new BadRequestException('No students in this class');
    if (subjectList.length === 0) throw new BadRequestException('No subjects in this class');

    const scoreList = await this.scores.findByClass(schoolId, dto.classId, dto.term, dto.academicYear);
    const psychoList = await this.psychometric.findByClass(schoolId, dto.classId, dto.term, dto.academicYear);
    const commentList = await this.comments.findByClass(schoolId, dto.classId, dto.term, dto.academicYear);

    // Validate completeness
    const scoredStudents = new Set(scoreList.map((s) => s.studentId));
    const psychoStudents = new Set(psychoList.map((p) => p.studentId));
    const commentedStudents = new Set(commentList.filter((c) => c.teacherComment).map((c) => c.studentId));

    for (const student of studentList) {
      const studentScores = scoreList.filter((s) => s.studentId === student.id);
      if (studentScores.length < subjectList.length) {
        throw new BadRequestException(`Incomplete scores for student: ${student.firstName} ${student.lastName}`);
      }
      if (!psychoStudents.has(student.id)) {
        throw new BadRequestException(`Missing psychometric assessment for: ${student.firstName} ${student.lastName}`);
      }
      if (!commentedStudents.has(student.id)) {
        throw new BadRequestException(`Missing comment for: ${student.firstName} ${student.lastName}`);
      }
    }

    const existing = await this.repo.findOne({
      where: { classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
    });

    const teacherName = `${teacherUser.firstName} ${teacherUser.lastName}`;

    let result: ClassResult;
    if (existing) {
      if (existing.status === 'approved') {
        throw new ForbiddenException('Approved results cannot be resubmitted');
      }
      await this.repo.update(existing.id, {
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: teacherUser.id,
        teacherId: teacherUser.id,
        teacherName,
        rejectionReason: null,
        rejectedAt: null,
        rejectedBy: null,
      });
      result = await this.repo.findOne({ where: { id: existing.id } }) as ClassResult;
    } else {
      result = await this.repo.save(
        this.repo.create({
          classId: dto.classId,
          className: cls.name,
          schoolId,
          teacherId: teacherUser.id,
          teacherName,
          term: dto.term,
          academicYear: dto.academicYear,
          status: 'submitted',
          submittedAt: new Date(),
          submittedBy: teacherUser.id,
        }),
      );
    }

    await this.notifications.create({
      fromUserId: teacherUser.id,
      fromUserName: teacherName,
      toUserRole: 'school_admin',
      schoolId,
      type: 'result_submitted',
      title: `Results Ready — ${cls.name}`,
      message: `${teacherName} has submitted results for ${cls.name} (${dto.term} term, ${dto.academicYear}).`,
      classId: dto.classId,
      className: cls.name,
      term: dto.term,
      academicYear: dto.academicYear,
    });

    // Email the principal(s) in this school
    const principals = await this.users.findBySchool(schoolId);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    for (const p of principals.filter((u) => u.role === 'school_admin')) {
      this.mail.sendResultSubmittedAlert({
        to: p.email,
        principalName: `${p.firstName} ${p.lastName}`,
        teacherName,
        className: cls.name,
        term: dto.term,
        academicYear: dto.academicYear,
        appUrl: frontendUrl,
        message: dto.message,
      });
    }

    return result;
  }

  findAll(schoolId: string, status?: string, term?: string, academicYear?: string) {
    const where: any = { schoolId };
    if (status) where.status = status;
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    return this.repo.find({ where, order: { submittedAt: 'DESC' } });
  }

  async findOne(schoolId: string, classId: string, term: string, academicYear: string) {
    const r = await this.repo.findOne({ where: { classId, schoolId, term: term as any, academicYear } });
    if (!r) throw new NotFoundException('Result record not found');
    return r;
  }

  async approve(schoolId: string, id: string, dto: ApproveResultDto, principalUser: any) {
    const result = await this.repo.findOne({ where: { id, schoolId } });
    if (!result) throw new NotFoundException('Result not found');
    if (result.status !== 'submitted') throw new BadRequestException('Only submitted results can be approved');

    await this.repo.update(id, {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: principalUser.id,
      principalNote: dto.principalNote,
    });

    await this.notifications.create({
      fromUserId: principalUser.id,
      fromUserName: `${principalUser.firstName} ${principalUser.lastName}`,
      toUserRole: 'teacher',
      schoolId,
      type: 'result_approved',
      title: `Results Approved — ${result.className}`,
      message: `Your results for ${result.className} (${result.term} term) have been approved.`,
      classId: result.classId,
      className: result.className,
      term: result.term,
      academicYear: result.academicYear,
    });

    const teacher = await this.users.findById(result.teacherId);
    if (teacher) {
      this.mail.sendResultDecisionAlert({
        to: teacher.email,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        className: result.className,
        term: result.term,
        decision: 'approved',
        principalNote: dto.principalNote,
        appUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      });
    }

    return this.repo.findOne({ where: { id } });
  }

  async reject(schoolId: string, id: string, dto: RejectResultDto, principalUser: any) {
    const result = await this.repo.findOne({ where: { id, schoolId } });
    if (!result) throw new NotFoundException('Result not found');
    if (result.status !== 'submitted') throw new BadRequestException('Only submitted results can be rejected');

    await this.repo.update(id, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: principalUser.id,
      rejectionReason: dto.rejectionReason,
    });

    await this.notifications.create({
      fromUserId: principalUser.id,
      fromUserName: `${principalUser.firstName} ${principalUser.lastName}`,
      toUserRole: 'teacher',
      schoolId,
      type: 'result_rejected',
      title: `Results Returned — ${result.className}`,
      message: `Your results for ${result.className} were returned. Reason: ${dto.rejectionReason}`,
      classId: result.classId,
      className: result.className,
      term: result.term,
      academicYear: result.academicYear,
    });

    const teacher = await this.users.findById(result.teacherId);
    if (teacher) {
      this.mail.sendResultDecisionAlert({
        to: teacher.email,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        className: result.className,
        term: result.term,
        decision: 'rejected',
        reason: dto.rejectionReason,
        appUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      });
    }

    return this.repo.findOne({ where: { id } });
  }

  async getComputedResults(schoolId: string, classId: string, term: string, academicYear: string) {
    const studentList = await this.students.findByClass(schoolId, classId);
    const subjectList = await this.subjects.findAll(schoolId, classId);
    const scoreList = await this.scores.findByClass(schoolId, classId, term, academicYear);
    const psychoList = await this.psychometric.findByClass(schoolId, classId, term, academicYear);
    const commentList = await this.comments.findByClass(schoolId, classId, term, academicYear);

    const studentResults = studentList.map((student) => {
      const studentScores = scoreList.filter((s) => s.studentId === student.id);
      const totalScore = studentScores.reduce((sum, s) => sum + s.total, 0);
      const totalPossible = subjectList.length * 100;
      const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

      return {
        student,
        scores: studentScores,
        psychometricAssessment: psychoList.find((p) => p.studentId === student.id) ?? null,
        comment: commentList.find((c) => c.studentId === student.id) ?? null,
        totalScore,
        totalPossible,
        percentage,
      };
    });

    // Compute positions
    const sorted = [...studentResults].sort((a, b) => b.percentage - a.percentage);
    const classHighest = sorted[0]?.percentage ?? 0;
    const classAverage =
      studentResults.length > 0
        ? studentResults.reduce((sum, r) => sum + r.percentage, 0) / studentResults.length
        : 0;

    return studentResults.map((r) => ({
      ...r,
      position: sorted.findIndex((s) => s.student.id === r.student.id) + 1,
      totalStudents: studentList.length,
      classHighest,
      classAverage,
      term,
      academicYear,
    }));
  }
}
