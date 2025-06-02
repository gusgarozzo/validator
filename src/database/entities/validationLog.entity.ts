
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class ValidationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.id, { eager: true })
  user: User;

  @Column()
  endpoint: string;

  @Column()
  input: string;

  @Column()
  valid: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
