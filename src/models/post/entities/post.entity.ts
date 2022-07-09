import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Travel } from '../../travel/entities/travel.entity';

@Entity()
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 128 })
  public title: string;

  @Column({ length: 128 })
  public destination: string;

  @Column({ length: 512 })
  public description: string;

  @Column({ type: 'date' })
  public createdAt: string;

  @Column({
    length: 50,
    nullable: true,
    default: null,
  })
  public photoFn: string;

  @ManyToOne((type) => Travel, (travel) => travel.posts)
  @JoinTable()
  public travel: Travel;
}
