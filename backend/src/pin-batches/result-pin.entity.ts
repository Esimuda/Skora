import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('result_pins')
@Index(['schoolId', 'isActive'])
@Index(['batchId'])
export class ResultPin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  batchId: string;

  @Column()
  schoolId: string;

  // PIN stored as bcrypt hash — never stored plain after generation
  @Column({ select: false })
  pin: string;

  // Plain PIN stored temporarily for PDF card generation only.
  // Cleared to null immediately after the school downloads the cards PDF.
  @Column({ nullable: true, select: false })
  pinDisplay: string;

  @Column({ default: 5 })
  usesRemaining: number;

  @Column({ default: 5 })
  usesTotal: number;

  @Column()
  term: string;

  @Column()
  academicYear: string;

  // False until the batch is activated by super admin
  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}