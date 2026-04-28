import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';

@Entity('psychometric_assessments')
@Unique(['studentId', 'classId', 'term', 'academicYear'])
@Index(['classId', 'term', 'academicYear'])
@Index(['schoolId', 'term'])
export class PsychometricAssessment {
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

  @Column({ type: 'jsonb' })
  ratings: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
