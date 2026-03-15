import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from '../types/token.type';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const refreshToken = req.cookies?.refreshToken;
          console.log('Extracted RT:', refreshToken);
          return refreshToken;
        },
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('RF_SECRET_KEY') as string,
    });
    console.log('RefreshTokenStrategy initialized');
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refreshToken;
    console.log(refreshToken);
    console.log('Payload in RT strategy:', payload);
    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

    const storedRT = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedRT) {
      throw new ForbiddenException('Token not found or revoked');
    }
    const isValid = await bcrypt.compare(refreshToken, storedRT.token);
    if (!isValid) {
      throw new ForbiddenException('Invalid refresh token');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      RTId: storedRT.id,
    };
  }
}
