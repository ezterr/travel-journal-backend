import { TravelInterface } from 'src/types';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinTable,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Travel extends BaseEntity implements TravelInterface {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 128 })
  public title: string;

  @Column({ length: 512 })
  public description: string;

  @Column({ length: 128 })
  public destination: string;

  @Column({ precision: 4 })
  public comradesCount: number;

  @Column({ length: 50 })
  public photoFn: string;

  @Column({ type: 'date' })
  public travelStartAt: Date;

  @Column({ type: 'date' })
  public travelEndAt: Date;

  @ManyToOne((type) => User, (user) => user.travels)
  @JoinTable()
  public user: User;
}
