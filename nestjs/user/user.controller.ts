import {
  Put,
  Get,
  Post,
  Controller,
  Body,
  BadRequestException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserEntity } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('changeemail')
  async changeEmail(
    @Body('email') email: string,
    @Body('changeEmail') changeEmail: string,
  ) {
    try {
      // validate
      if (!email || email.trim() === '') {
        throw new BadRequestException('email cannot be empty');
      }
      if (!changeEmail || changeEmail.trim() === '') {
        throw new BadRequestException('change email cannot be empty');
      }
      if (changeEmail.length < 8) {
        throw new BadRequestException('change must be atleast 8 charachter');
      }
      if (email.length < 8) {
        throw new BadRequestException('change must be atleast 8 charachter');
      }

      return await this.userService.changeEmail(email, changeEmail);
    } catch (err) {
      throw new BadRequestException(err.message || 'unknown message');
    }
  }

  @Put('changeusername')
  async changeUsername(
    @Body('email') email: string,
    @Body('username') username: string,
  ) {
    try {
      if (!email || email.trim() === '') {
        throw new BadRequestException('email cannot be empty');
      }
      if (!username || username.trim() === '') {
        throw new BadRequestException('username cannot be empty');
      }
      if (email.length < 8) {
        throw new BadRequestException('email must be atleast 8 charachter');
      }
      if (username.length < 2) {
        throw new BadRequestException('username must be atleast 2 charachter');
      }
      console.info('username changed');
      await this.userService.changeUsername(email, username);
    } catch (err) {
      throw new BadRequestException(err.message || 'unknown message');
    }
  }

  @Get('getaalluser')
  async all() {
    try {
      const data = await this.userService.getAllUser();
      if (!data) {
        throw new BadRequestException('user is empty');
      }
      return data;
    } catch (er) {
      throw new BadRequestException(er);
    }
  }

  @Get('/:id')
  async getUser(@Req() request: Request): Promise<UserEntity> {
    try {
      const id = Number(request.params.id);

      if (!id || isNaN(id)) {
        throw new BadRequestException();
      }
      return await this.userService.getUserById(id);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
