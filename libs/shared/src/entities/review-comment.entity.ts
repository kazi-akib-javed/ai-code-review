import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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

  @Column()
  reviewId: string;

  @CreateDateColumn()
  createdAt: Date;
}
