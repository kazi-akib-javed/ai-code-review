import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewEntity } from './review.entity';

@Entity('review_comments')
export class ReviewCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filePath: string;

  @Column()
  line: number;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: 'info' })
  severity: string;

  @ManyToOne(() => ReviewEntity, (review) => review.id)
  @JoinColumn({ name: 'reviewId' })
  review: ReviewEntity;

  @CreateDateColumn()
  createdAt: Date;
}
