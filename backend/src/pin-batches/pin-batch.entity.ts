import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('pin_batches')
export class PinBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  schoolId: string;

  // Denormalised for easy admin display without joins
  @Column()
  schoolName: string;

  @Column({ nullable: true })
  principalName: string;

  @Column({ nullable: true })
  principalEmail: string;

  @Column()
  quantity: number;

  @Column({ default: 5 })
  usesPerPin: number;

  @Column({ default: 1000 })
  unitPrice: number;

  @Column()
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ['pending_payment', 'active', 'exhausted'],
    default: 'pending_payment',
  })
  status: 'pending_payment' | 'active' | 'exhausted';

  @Column()
  term: string;

  @Column()
  academicYear: string;

  // Filled by super admin when activating
  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  activatedAt: Date;

  @Column({ nullable: true })
  activatedBy: string;

  @CreateDateColumn()
  requestedAt: Date;
}