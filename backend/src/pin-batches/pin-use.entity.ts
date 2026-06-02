import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('pin_uses')
@Index(['pinId'])
@Index(['schoolId', 'studentId'])
export class PinUse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  pinId!: string;

  @Column()
  schoolId!: string;

  @Column()
  studentId!: string;

  // Denormalised for easy audit log display without joins
  @Column()
  studentName!: string;

  @Column()
  admissionNumber!: string;

  @Column()
  term!: string;

  @Column()
  academicYear!: string;

  // IP address for rate limiting and fraud detection
  @Column({ nullable: true })
  ipAddress!: string;

  @CreateDateColumn()
  usedAt!: Date;
}
