import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('payouts')
@Index(['schoolId'])
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  schoolId!: string;

  // Denormalised for easy admin display without joins
  @Column()
  schoolName!: string;

  @Column()
  amount!: number;

  @Column({ nullable: true })
  bankName!: string;

  @Column({ nullable: true })
  accountNumber!: string;

  @Column({ nullable: true })
  accountName!: string;

  // Bank transfer reference — proof of payment
  @Column()
  reference!: string;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  // Super admin user ID who recorded this payout
  @Column()
  processedBy!: string;

  @CreateDateColumn()
  processedAt!: Date;
}
