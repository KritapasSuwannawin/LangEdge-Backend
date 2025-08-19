import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Language } from './language.entity';

@Entity('translation')
@Unique(['input_text', 'input_language_id', 'output_language_id'])
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  input_text: string;

  @Column({ type: 'int' })
  input_language_id: number;

  @ManyToOne(() => Language, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'input_language_id' })
  inputLanguage: Language;

  @Column({ type: 'text' })
  output_text: string;

  @Column({ type: 'int' })
  output_language_id: number;

  @ManyToOne(() => Language, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'output_language_id' })
  outputLanguage: Language;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
