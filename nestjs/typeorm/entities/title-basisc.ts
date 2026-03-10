import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'title_basics' })
export class TitleBacis {
  @PrimaryColumn({ type: 'varchar', length: 12 })
  tconst: string;

  @Column({ type: 'varchar', length: 20 })
  titleType: string;

  @Column({ type: 'text' })
  primarytitle: string;

  @Column({ type: 'text' })
  orginalTitle: string;

  @Column({ type: 'tinyint' })
  isAdult: number;

  @Column({ type: 'smallint' })
  startYear: number;

  @Column({ type: 'smallint' })
  endYear: number;

  @Column({ type: 'smallint' })
  runtimeMinutes: number;

  @Column({ type: 'varchar', length: 255 })
  genres: string;
}
