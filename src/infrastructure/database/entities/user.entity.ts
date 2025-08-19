import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Language } from './language.entity';

@Entity('user')
export class User {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  picture_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  last_used_language_id: number | null;

  @ManyToOne(() => Language, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'last_used_language_id' })
  lastUsedLanguage?: Language;
}
