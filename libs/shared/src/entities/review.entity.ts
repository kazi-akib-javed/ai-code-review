import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewStatus } from '../enums';
import { PullRequestEntity } from './pull-request.entity';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ nullable: true, type: 'text' })
  summary: string;

  @Column({ nullable: true })
  processingStartedAt: Date;

  @Column({ nullable: true })
  processingCompletedAt: Date;

  @ManyToOne(() => PullRequestEntity, (pr) => pr.id)
  @JoinColumn({ name: 'pullRequestId' })
  pullRequest: PullRequestEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
