import { TravelInterface } from 'src/types';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';

@Entity()
export class Travel extends BaseEntity implements TravelInterface {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 64 })
  public title: string;

  @Column({ length: 512 })
  public description: string;

  @Column({ length: 64 })
  public destination: string;

  @Column({ precision: 4 })
  public comradesCount: number;

  @Column({ length: 50 })
  public photoFn: string;

  @Column({ type: 'date' })
  public startAt: Date;

  @Column({ type: 'date' })
  public endAt: Date;

  @ManyToOne((type) => User, (user) => user.travels, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  public user: User;

  @OneToMany((type) => Post, (post) => post.travel)
  public posts: Post[];
}
