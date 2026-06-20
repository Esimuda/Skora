import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Tracks per-term ZIP download access for a school.
// Scope 'class'  → unlocks one specific class for the term.
// Scope 'school' → unlocks every class in the school for the term.
// Once active, the school can re-download as many times as they want
// for that term at no extra charge. Next term they pay again.
@Entity('download_unlocks')
export class DownloadUnlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  schoolId!: string;

  // Denormalised for admin display — avoids joins
  @Column()
  schoolName!: string;

  @Column({ nullable: true })
  principalName!: string;

  @Column({ nullable: true })
  principalEmail!: string;

  @Column()
  term!: string;

  @Column()
  academicYear!: string;

  // 'class' = one class only, 'school' = entire school
  @Column({ type: 'enum', enum: ['class', 'school'] })
  scope!: 'class' | 'school';

  // Populated only when scope = 'class'
  @Column({ type: 'varchar', nullable: true })
  classId!: string | null;

  // Denormalised class name for admin display
  @Column({ type: 'varchar', nullable: true })
  className!: string | null;

  // Number of students covered by this unlock (used for pricing display)
  @Column()
  studentCount!: number;

  // Price per student in Naira
  @Column()
  unitPrice!: number;

  @Column()
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: ['pending_payment', 'active'],
    default: 'pending_payment',
  })
  status!: 'pending_payment' | 'active';

  @Column({ nullable: true })
  paymentReference!: string;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @Column({ nullable: true })
  activatedAt!: Date;

  @Column({ nullable: true })
  activatedBy!: string;

  @CreateDateColumn()
  requestedAt!: Date;
}
