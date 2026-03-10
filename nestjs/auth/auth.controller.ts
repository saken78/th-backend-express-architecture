import {
  Put,
  Res,
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthEntity } from './auth.entity';
import { Request } from 'express';
import { LoginDTO } from './dto/login-dto';
import { RegisterDTO } from './dto/register-dto';
import { ResetDTO } from './dto/reset-dto';
import { CookiePayload } from './dto/cookie-interface';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDTO: RegisterDTO): Promise<AuthEntity> {
    // validate
    if (!registerDTO.username || registerDTO.username.trim() === '') {
      throw new BadRequestException('username cannot be empty');
    }

    if (!registerDTO.email || registerDTO.email.trim() === '') {
      throw new BadRequestException('email cannot be empty');
    }

    if (!registerDTO.password || registerDTO.password.trim() === '') {
      throw new BadRequestException('password cannot be empty');
    }

    if (registerDTO.password.length < 8) {
      throw new BadRequestException('password must be atleast 8 charachter');
    }

    if (registerDTO.username.length < 2) {
      throw new BadRequestException('username must be atleast 2 charachter');
    }
    if (registerDTO.email.length < 8) {
      throw new BadRequestException('email must be atleast 8 charachter');
    }

    const user = await this.authService.create(
      registerDTO.username,
      registerDTO.email,
      registerDTO.password,
    );
    return user;
  }

  @Post('login')
  async login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    // validate
    if (!loginDTO.email || loginDTO.email.trim() === '') {
      throw new BadRequestException('email cannot be empty');
    }
    if (!loginDTO.password || loginDTO.password.trim() === '') {
      throw new BadRequestException('password cannot be empty');
    }
    if (loginDTO.password.length < 8) {
      throw new BadRequestException('password minimum is 8 charachter');
    }
    if (loginDTO.email.length < 8) {
      throw new BadRequestException('email minimum is 8 charachter');
    }

    // validate user
    const user = await this.authService.login(
      loginDTO.email,
      loginDTO.password,
    );

    response.cookie('refreshToken', user.refreshToken, { httpOnly: true });
    response.cookie('accessToken', user.accessToken);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as CookiePayload)['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const tokens = await this.authService.refresh(refreshToken);

    res.cookie('accessToken', tokens.accessToken);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
  }

  @Put('reset')
  async resetPassword(@Body() resetDTO: ResetDTO) {
    try {
      if (!resetDTO.email || resetDTO.email.trim() === '') {
        throw new BadRequestException('email cannot be empty');
      }
      if (!resetDTO.password || resetDTO.password.trim() === '') {
        throw new BadRequestException('password cannot be empty');
      }
      if (!resetDTO.repeat || resetDTO.repeat.trim() === '') {
        throw new BadRequestException('repeat password cannot be empty');
      }
      if (resetDTO.email.length < 8) {
        throw new BadRequestException('email must be atleast 8 charachter');
      }
      if (resetDTO.password.length < 8) {
        throw new BadRequestException('password must be atleast 8 charachter');
      }
      if (resetDTO.repeat.length < 8) {
        throw new BadRequestException(
          'repeat password must be atleast 8 charachter',
        );
      }
      if (resetDTO.password !== resetDTO.repeat) {
        throw new BadRequestException(
          'password and repeat password is not the same',
        );
      }
      await this.authService.resetPassword(resetDTO.email, resetDTO.password);
    } catch (err: unknown) {
      throw new BadRequestException(
        (err as Error).message || 'unknown message',
      );
    }
  }

  @Put('delete')
  async delete(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('confPassword') confPassword: string,
  ) {
    if (!email || email.trim() === '') {
      throw new BadRequestException('email cannot be empty');
    }
    if (!password || password.trim() === '') {
      throw new BadRequestException('password cannot be empty');
    }
    if (password.length < 8) {
      throw new BadRequestException('password must be atleast 8 charachter');
    }
    if (email.length < 8) {
      throw new BadRequestException('email must be atleast 8 charachter');
    }
    if (!confPassword || confPassword.trim() === '') {
      throw new BadRequestException('cofirmation password cannot be empty');
    }
    if (confPassword.length < 8) {
      throw new BadRequestException(
        'confirmation password must be atleast 8 charachter',
      );
    }
    if (confPassword !== password) {
      throw new BadRequestException(
        'confirmation password and password is not same',
      );
    }

    await this.authService.deleteSQL(email);
  }

  @Get('verify')
  async verify(@Req() request: Request) {
    // ambil cookie
    const cookie = (request.cookies as CookiePayload).accessToken;
    await this.authService.verify(cookie);
  }

  @Put('logout')
  async logout(
    @Body('email') email: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('refreshToken');
    response.clearCookie('accessToken');
    await this.authService.logout(email);
    return {
      message: 'clear Cookie',
    };
  }
}
