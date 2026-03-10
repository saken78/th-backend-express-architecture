import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'name_basics' })
export class NameBasics {
  @PrimaryColumn({ type: 'varchar', length: 12 })
  tcsonst: string;

  @Column({ type: 'text' })
  primaryName: string;

  @Column({ type: 'smallint' })
  birthYear: number;

  @Column({ type: 'smallint' })
  deathYear: number;
}
