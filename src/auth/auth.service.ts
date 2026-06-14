import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/services/users.service';
import { User } from '../users/models';

type TokenResponse = {
  token_type: string;
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(payload: User) {
    const user = await this.usersService.findOne(payload.name);

    if (user) {
      throw new BadRequestException('User with such name already exists');
    }

    const newUser = await this.usersService.createOne(payload);

    return { userId: newUser.id };
  }

  async validateUser(name: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOne(name);

    if (!user) {
      return null;
    }

    if (user.password !== password) {
      return null;
    }

    return user;
  }

  login(user: User, type: 'jwt' | 'basic' | 'default'): TokenResponse {
    const map = {
      jwt: this.loginJWT.bind(this),
      basic: this.loginBasic.bind(this),
      default: this.loginJWT.bind(this),
    };

    return (map[type] || map.default)(user);
  }

  loginJWT(user: User): TokenResponse {
    const payload = { username: user.name, sub: user.id };

    return {
      token_type: 'Bearer',
      access_token: this.jwtService.sign(payload),
    };
  }

  loginBasic(user: User): TokenResponse {
    const token = Buffer.from(`${user.name}:${user.password}`).toString(
      'base64',
    );

    return {
      token_type: 'Basic',
      access_token: token,
    };
  }
}
