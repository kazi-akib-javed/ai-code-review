import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { PullRequestEntity } from './pull-request.entity';
  import { ReviewStatus } from '../enums';
  
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
  
    @ManyToOne(() => PullRequestEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pull_request_id' })
    pullRequest: PullRequestEntity;
  
    @Column()
    pullRequestId: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }