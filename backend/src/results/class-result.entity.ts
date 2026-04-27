import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('class_results')
@Unique(['classId', 'term', 'academicYear'])
export class ClassResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @Column()
  className: string;

  @Column()
  schoolId: string;

  @Column()
  teacherId: string;

  @Column()
  teacherName: string;

  @Column()
  term: 'first' | 'second' | 'third';

  @Column()
  academicYear: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'submitted' | 'approved' | 'rejected';

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  submittedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  principalNote: string;

  @Column({ nullable: true })
  rejectedAt: Date | null;

  @Column({ nullable: true })
  rejectedBy: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
