import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Language } from './language.entity';

@Entity('synonym')
@Unique(['text', 'language_id'])
export class Synonym {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  synonym_arr: string[];

  @Column({ type: 'int' })
  language_id: number;

  @ManyToOne(() => Language, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
