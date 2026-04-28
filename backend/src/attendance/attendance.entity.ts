import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';

@Entity('attendance_records')
@Unique(['studentId', 'classId', 'term', 'academicYear'])
@Index(['classId', 'term', 'academicYear'])
@Index(['schoolId', 'term'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @Column()
  classId: string;

  @Column()
  schoolId: string;

  @Column()
  term: 'first' | 'second' | 'third';

  @Column()
  academicYear: string;

  @Column({ default: 0 })
  daysSchoolOpened: number;

  @Column({ default: 0 })
  daysPresent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
