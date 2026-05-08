import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { UserEntity } from './user.entity';
  
  @Entity('repositories')
  export class RepositoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    fullName: string;
  
    @Column()
    githubRepoId: string;
  
    @Column({ default: true })
    isActive: boolean;
  
    @Column()
    installationId: string;
  
    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
  
    @Column()
    userId: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }