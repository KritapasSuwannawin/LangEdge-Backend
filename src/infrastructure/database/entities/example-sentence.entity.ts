import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Language } from './language.entity';

@Entity('example_sentence')
@Unique(['text', 'language_id', 'output_language_id'])
export class ExampleSentence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'int', array: true, default: () => "'{}'" })
  example_sentence_translation_id_arr: number[];

  @Column({ type: 'int' })
  language_id: number;

  @ManyToOne(() => Language, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @Column({ type: 'int' })
  output_language_id: number;

  @ManyToOne(() => Language, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'output_language_id' })
  outputLanguage: Language;
}
