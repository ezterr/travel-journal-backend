import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';
import { CreateUserResponse } from '../../types/user/user';

@Injectable()
export class UserService {
  async create(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    await this.checkUserFieldUniqueness({ email: createUserDto.email });
    await this.checkUserFieldUniqueness({ username: createUserDto.username });

    const user = new User();
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.username = createUserDto.username;
    user.email = createUserDto.email;
    user.hashPwd = await hash(createUserDto.password, 13);

    await user.save();
    const { hashPwd, jwtId, ...userResponse } = user;

    return userResponse;
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    const { jwtId, hashPwd, ...userResponse } = user;
    return userResponse;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async checkUserFieldUniqueness(value: { [key: string]: any }): Promise<void> {
    const user = await User.findOne({
      where: value,
    });

    const [key] = Object.keys(value);
    if (user) throw new ConflictException(`${key} is not unique`);
  }
}
