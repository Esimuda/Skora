import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  schoolId: string;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column()
  senderRole: 'admin' | 'school_admin' | 'teacher';

  @Column()
  recipientId: string;

  @Column()
  recipientName: string;

  @Column()
  recipientRole: 'admin' | 'school_admin' | 'teacher';

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  classId: string;

  @Column({ nullable: true })
  className: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
