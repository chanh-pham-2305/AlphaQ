import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AtUser } from '../types/auth.type';
import { JwtPayload } from '../types/token.type';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('AT_SECRET_KEY') as string,
    });
  }

  validate(payload: JwtPayload): AtUser {
    return { userId: payload.sub, email: payload.email };
  }
}
