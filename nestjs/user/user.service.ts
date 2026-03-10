import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // change username
  async changeUsername(email, username): Promise<UserEntity> {
    try {
      if (!(await this.userRepository.findOne({ where: { email } }))) {
        throw new BadRequestException('this email did not exits');
      }
      return await this.userRepository.query(
        'UPDATE users SET username = ? WHERE email = ? ',
        [username, email],
      );
    } catch (err) {
      throw new BadRequestException(err.message || 'unknown error');
    }
  }

  // change email
  async changeEmail(email, changeEmail): Promise<UserEntity> {
    try {
      if (!(await this.userRepository.findOne({ where: { email } }))) {
        throw new BadRequestException('this email did not exist');
      }
      return await this.userRepository.query(
        'UPDATE users SET email = ? WHERE email = ? ',
        [changeEmail, email],
      );
    } catch (er) {
      throw new BadRequestException(er.message || 'unknown message');
    }
  }

  // SQL
  async getUserById(id: number): Promise<UserEntity> {
    try {
      return await this.userRepository.query(
        'SELECT email, username FROM users where id = ?',
        [id],
      );
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  // find all user (safely)
  async getAllUser() {
    try {
      const data = await this.userRepository.find({
        select: ['email', 'username'],
        take: 20,
        order: { id: 'ASC' },
      });

      if (!data) {
        throw new BadRequestException('data didnt exist');
      }

      return data;
    } catch (err) {
      throw new BadRequestException(err.message || 'unknown error');
    }
  }
}
