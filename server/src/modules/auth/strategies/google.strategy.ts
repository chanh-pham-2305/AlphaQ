import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') as string,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const userInput = {
      googleId: profile.id,
      email: profile.emails?.[0]?.value as string,
      fullname: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value as string,
    };
    const user = await this.authService.validateUserGoogle(userInput);

    if (!user) {
      throw new UnauthorizedException('Google authentication failed');
    }
    await this.authService.saveAccessTokenGoogle({
      googleId: profile.id,
      accessToken,
    });
    await this.authService.saveRefreshToken({
      userId: user.id,
      refreshToken,
      googleId: profile.id,
    });
    return user;
  }
}
