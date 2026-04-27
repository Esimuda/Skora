import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  motto: string;

  @Column({ nullable: true, type: 'text' })
  logo: string;

  @Column({ nullable: true })
  principalName: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  lga: string;

  @Column({ nullable: true, default: 'public' })
  schoolType: 'public' | 'private' | 'mission';

  @Column({ default: 'classic' })
  templateId: 'classic' | 'modern' | 'hybrid';

  @Column({ nullable: true })
  currentTerm: 'first' | 'second' | 'third';

  @Column({ nullable: true })
  currentAcademicYear: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
