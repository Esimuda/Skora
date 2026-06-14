import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Ip,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { SchoolsService } from '../schools/schools.service';
import { StudentsService } from '../students/students.service';
import { ClassesService } from '../classes/classes.service';
import { ResultsService } from '../results/results.service';
import { PinBatchesService } from '../pin-batches/pin-batches.service';
import { IsNotEmpty, IsString } from 'class-validator';

class ValidatePinDto {
  @IsString() @IsNotEmpty() schoolId!: string;
  @IsString() @IsNotEmpty() studentId!: string;
  @IsString() @IsNotEmpty() term!: string;
  @IsString() @IsNotEmpty() academicYear!: string;
  @IsString() @IsNotEmpty() pin!: string;
}

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(
    private schools: SchoolsService,
    private students: StudentsService,
    private classes: ClassesService,
    private results: ResultsService,
    private pinBatches: PinBatchesService,
  ) {}

  // Public — look up a single school by its portal code.
  // Returns only name, address, id — no sensitive data.
  // Parents type their school's code (e.g. "GRNFLD") to find their school.
  @Get('schools/lookup')
  async lookupSchool(@Query('code') code: string) {
    if (!code?.trim()) throw new BadRequestException('School code is required.');
    const school = await this.schools.findByPortalCode(code);
    // Return only what the portal needs — don't expose full school record
    return {
      id: school.id,
      name: school.name,
      address: school.address,
      logo: school.logo,
    };
  }

  // Public — list classes for a school
  @Get('schools/:schoolId/classes')
  getClasses(@Param('schoolId') schoolId: string) {
    return this.classes.findAll(schoolId);
  }

  // Public — list students in a class (name + photo only, for child confirmation step)
  @Get('schools/:schoolId/classes/:classId/students')
  async getStudents(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
  ) {
    const students = await this.students.findByClass(schoolId, classId);
    return students.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      middleName: s.middleName,
      admissionNumber: s.admissionNumber,
      photoUrl: (s as any).photoUrl ?? null,
    }));
  }

  // Public — check if an active batch exists for a school/term
  @Get('schools/:schoolId/term-status')
  async getTermStatus(
    @Param('schoolId') schoolId: string,
    @Query('term') term: string,
    @Query('academicYear') academicYear: string,
  ) {
    if (!term || !academicYear) return { hasActiveBatch: false };
    const stats = await this.pinBatches.getBatchStats(schoolId, term, academicYear);
    return { hasActiveBatch: stats.hasActiveBatch };
  }

  // Rate-limited — max 5 PIN attempts per IP per hour
  @Post('validate-pin')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  async validatePin(@Body() dto: ValidatePinDto, @Ip() ip: string) {
    const student = await this.students.findOne(dto.schoolId, dto.studentId).catch(() => null);
    if (!student) throw new BadRequestException('Student not found');

    const result = await this.pinBatches.validateAndConsumePin({
      schoolId: dto.schoolId,
      rawPin: dto.pin,
      studentId: dto.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: (student as any).admissionNumber ?? '',
      term: dto.term,
      academicYear: dto.academicYear,
      ipAddress: ip,
    });

    if (!result.valid) {
      throw new BadRequestException(result.reason ?? 'Invalid PIN');
    }

    const allResults = await this.results.getComputedResults(
      dto.schoolId,
      student.classId,
      dto.term,
      dto.academicYear,
    );

    const studentResult = allResults.find((r) => r.student.id === dto.studentId);
    if (!studentResult) throw new BadRequestException('Result not found for this student and term');

    const school = await this.schools.findOne(dto.schoolId);

    return {
      valid: true,
      usesRemaining: result.usesRemaining,
      result: studentResult,
      school: {
        id: school.id,
        name: school.name,
        address: school.address,
        email: school.email,
        phoneNumber: school.phoneNumber,
        motto: school.motto,
        logo: school.logo,
        templateId: school.templateId,
      },
    };
  }
}
