import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('result_comments')
@Unique(['studentId', 'classId', 'term', 'academicYear'])
export class ResultComment {
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

  @Column({ type: 'text', nullable: true })
  teacherComment: string;

  @Column({ type: 'text', nullable: true })
  principalComment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
