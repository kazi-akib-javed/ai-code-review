import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PrStatus } from '../enums';

@Entity('pull_requests')
export class PullRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  prNumber: number;

  @Column()
  title: string;

  @Column()
  authorUsername: string;

  @Column()
  headSha: string;

  @Column()
  baseSha: string;

  @Column({
    type: 'enum',
    enum: PrStatus,
    default: PrStatus.OPEN,
  })
  status: PrStatus;

  @Column()
  repositoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
