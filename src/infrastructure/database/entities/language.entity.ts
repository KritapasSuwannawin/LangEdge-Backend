import { Entity, PrimaryGeneratedColumn, Column, Unique, Check } from 'typeorm';

@Entity('language')
@Unique(['name'])
@Unique(['code'])
@Check(`name ~ '^[A-Z][a-z]+$'`)
@Check(`code ~ '^[a-z]{2}$'`)
export class Language {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  code: string;
}
