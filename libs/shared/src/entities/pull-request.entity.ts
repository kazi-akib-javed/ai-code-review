import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { RepositoryEntity } from './repository.entity';
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
  
    @ManyToOne(() => RepositoryEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'repository_id' })
    repository: RepositoryEntity;
  
    @Column()
    repositoryId: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }