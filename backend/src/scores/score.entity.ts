import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';

@Entity('scores')
@Unique(['studentId', 'subjectId', 'term', 'academicYear'])
@Index(['classId', 'term', 'academicYear'])
@Index(['schoolId', 'term', 'academicYear'])
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @Column()
  subjectId: string;

  @Column()
  classId: string;

  @Column()
  schoolId: string;

  @Column()
  term: 'first' | 'second' | 'third';

  @Column()
  academicYear: string;

  @Column({ type: 'float', default: 0 })
  ca1: number;

  @Column({ type: 'float', default: 0 })
  ca2: number;

  @Column({ type: 'float', default: 0 })
  exam: number;

  @Column({ type: 'float', default: 0 })
  total: number;

  @Column({ default: 'F9' })
  grade: string;

  @Column({ default: 'Fail' })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
