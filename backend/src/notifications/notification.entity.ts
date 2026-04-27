import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromUserId: string;

  @Column()
  fromUserName: string;

  @Column()
  toUserRole: 'admin' | 'school_admin' | 'teacher';

  @Column()
  schoolId: string;

  @Column()
  type: 'result_submitted' | 'result_approved' | 'result_rejected' | 'general';

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column()
  classId: string;

  @Column()
  className: string;

  @Column()
  term: string;

  @Column()
  academicYear: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
