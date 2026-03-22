import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { AtStrategy } from './strategies/access-token.strategy';
import { RtStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { RolesGuard } from 'src/global/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({
      accessType: 'offline',
      prompt: 'consent',
      session: false,
    }),
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    AtStrategy,
    RtStrategy,
    GoogleStrategy,
    RolesGuard,
  ],
})
export class AuthModule {}
