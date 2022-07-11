import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Travel } from '../../travel/entities/travel.entity';
import { User } from '../../user/entities/user.entity';

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

  @ManyToOne((type) => Travel, (travel) => travel.posts, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  public travel: Travel;

  @ManyToOne((type) => User, (user) => user.posts)
  @JoinTable()
  public user: User;
}
