import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notifications')
@Index(['schoolId', 'toUserRole', 'isRead'])  // unread count per role
@Index(['schoolId', 'isRead'])
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

  @Column({ nullable: true })
  classId: string;

  @Column({ nullable: true })
  className: string;

  @Column({ nullable: true })
  term: string;

  @Column({ nullable: true })
  academicYear: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
