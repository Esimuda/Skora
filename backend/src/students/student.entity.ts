import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('students')
@Index(['classId'])
@Index(['schoolId'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @Column()
  schoolId: string;

  @Column()
  admissionNumber: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column()
  gender: 'male' | 'female';

  @Column({ nullable: true })
  parentName: string;

  @Column({ nullable: true })
  parentPhone: string;

  @Column({ nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  address: string;

  // Passport photo stored as base64 string (same pattern as school logo)
  @Column({ nullable: true, type: 'text' })
  photoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}