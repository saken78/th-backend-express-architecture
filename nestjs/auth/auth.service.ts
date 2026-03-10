import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthEntity } from './auth.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Register } from './dto/register-interface';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './dto/payload-interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly jwtService: JwtService,
  ) {}

  // SQL QUERY
  async create(
    username: string,
    email: string,
    password: string,
  ): Promise<Register> {
    try {
      if (await this.authRepository.findOne({ where: { email } })) {
        throw new BadRequestException('email already used');
      }

      const hashPassword = await bcrypt.hash(password, 12);

      return await this.authRepository.query(
        'INSERT INTO users (username, email, password) VALUES(?, ?, ?)',
        [username, email, hashPassword],
      );
    } catch (err: unknown) {
      throw new BadRequestException((err as Error).message || 'unknown error');
    }
  }

  // login SQL
  async login(email: string, password: string) {
    const data = await this.authRepository.findOne({ where: { email } });
    if (!data) {
      throw new BadRequestException('Something went wrong');
    }
    const match = await bcrypt.compare(password, data.password);
    if (!match) {
      throw new UnauthorizedException();
    }
    const accessToken = await this.jwtService.signAsync(
      { id: data.id },
      { expiresIn: '15m' },
    );
    const refreshToken = await this.jwtService.signAsync(
      { id: data.id },
      { expiresIn: '7d' },
    );
    const hashed = await bcrypt.hash(refreshToken, 12);
    await this.authRepository.query(
      'UPDATE users SET hashedAccessToken = ? WHERE email = ?',
      [hashed, email],
    );
    return { refreshToken, accessToken };
  }

  async verify(cookie: string) {
    try {
      const data = await this.jwtService.verifyAsync<{ id: number }>(cookie);
      if (!data) {
        throw new UnauthorizedException();
      }
    } catch (err: unknown) {
      throw new UnauthorizedException(
        (err as Error).message || 'unknown message',
      );
    }
  }

  async refresh(refreshToken: string) {
    // make payload variable global
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException();
    }

    // find id
    const user = await this.authRepository.findOne({
      where: { id: payload.id },
    });

    // validate
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.hashedAccessToken) {
      throw new UnauthorizedException();
    }

    // check
    const valid = await bcrypt.compare(refreshToken, user.hashedAccessToken);
    if (!valid) {
      throw new UnauthorizedException();
    }

    // create token
    const accessToken = await this.jwtService.signAsync(
      { id: user.id },
      { expiresIn: '15m' },
    );
    const newRefresh = await this.jwtService.signAsync(
      { id: user.id },
      { expiresIn: '7d' },
    );
    const hash = await bcrypt.hash(newRefresh, 12);
    await this.authRepository.update(
      { id: user.id },
      { hashedAccessToken: hash },
    );

    return {
      accessToken,
      refreshToken: newRefresh,
    };
  }

  // delete with SQL
  async deleteSQL(email: string) {
    const data = await this.authRepository.findOne({ where: { email } });
    if (!data) {
      throw new BadRequestException('account is missing');
    }
    await this.authRepository.query('DELETE from users WHERE email = ? ', [
      email,
    ]);
  }

  // reset password SQL
  async resetPassword(email: string, password: string) {
    const data = await this.authRepository.findOne({ where: { email } });
    if (!data) {
      throw new BadRequestException('account is missing');
    }
    const hashPassword = await bcrypt.hash(password, 12);
    await this.authRepository.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashPassword, email],
    );
  }

  // logout
  async logout(email: string) {
    const data = await this.authRepository.findOne({ where: { email } });
    if (!data) {
      throw new BadRequestException('account is missing');
    }
    const token = '';
    await this.authRepository.query(
      'UPDATE users SET hashedAccessToken = ? WHERE email = ?',
      [token, email],
    );
  }
}
