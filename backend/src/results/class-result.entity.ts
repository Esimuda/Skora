import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';

@Entity('class_results')
@Unique(['classId', 'term', 'academicYear'])
@Index(['schoolId', 'status'])
@Index(['schoolId', 'term', 'academicYear'])
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

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  submittedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  principalNote: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  rejectedBy: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
