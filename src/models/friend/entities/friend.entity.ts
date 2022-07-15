import { BaseEntity, Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FriendInterface, FriendStatus } from '../../../types';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Friend extends BaseEntity implements FriendInterface {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne((type) => User, (user) => user.friends, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  public user: User;

  @ManyToOne((type) => User, (user) => user.friendsRevert, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  public friend: User;

  @Column({
    type: 'enum',
    enum: FriendStatus,
  })
  public status: FriendStatus;
}
