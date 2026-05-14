import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PrStatus } from '../enums';
import { RepositoryEntity } from './repository.entity';

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

  @ManyToOne(() => RepositoryEntity, (repository) => repository.id)
  @JoinColumn({ name: 'repositoryId' })
  repository: RepositoryEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
