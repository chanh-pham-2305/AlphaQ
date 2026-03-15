import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ATGoogleInput,
  RefreshTokenInput,
  SaveRTInput,
  Tokens,
} from './types/token.type';
import * as bcrypt from 'bcrypt';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  GoogleUserInput,
  SetPasswordInput,
} from './types/auth.type';
import { getRandomString } from 'src/utils/index.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    user: Pick<User, 'email' | 'password'>,
  ): Promise<Omit<User, 'password'> | null> {
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email already exists!');
    }

    const hashedPassword = await this.hashValue(user.password as string);

    const username = user.email?.split('@')[0];
    const userCreated = await this.prisma.user.create({
      data: {
        ...user,
        username,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = userCreated;

    return result;
  }

  async loginEmail(user: Pick<User, 'id'>): Promise<Tokens> {
    const userExisted = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!userExisted) {
      throw new BadRequestException('User not found!');
    }
    return {
      accessToken: this.generateAccessToken(userExisted),
      refreshToken: await this.generateRefreshToken(userExisted),
    };
  }

  async refreshToken(RTInput: RefreshTokenInput): Promise<Tokens> {
    const { userId, email, RTId } = RTInput;

    const newAT = this.generateAccessToken({ id: userId, email });
    const newRT = await this.generateRefreshToken({ id: userId, email });
    await this.rotateRefreshToken({ userId, oldRTId: RTId, newRT });
    return {
      accessToken: newAT,
      refreshToken: newRT,
    };
  }

  private async hashValue(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }

  private verifyValue(plainValue: string, hashValue: string): boolean {
    return bcrypt.compareSync(plainValue, hashValue);
  }

  private generateAccessToken({
    id,
    email,
  }: Pick<User, 'id' | 'email'>): string {
    const payload = {
      sub: id,
      email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('AT_SECRET_KEY'),
      expiresIn: '1h',
    });
  }

  private async generateRefreshToken({
    id,
    email,
  }: Pick<User, 'id' | 'email'>): Promise<string> {
    const payload = {
      sub: id,
      email,
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('RF_SECRET_KEY'),
      expiresIn: '7d',
    });

    //hash and save RT to db
    const hashedRefreshToken = await this.hashValue(refreshToken);
    await this.saveRefreshToken({
      userId: id,
      refreshToken: hashedRefreshToken,
    });

    return hashedRefreshToken;
  }

  async saveRefreshToken({
    userId,
    refreshToken,
    googleId,
    expires = 7,
  }: SaveRTInput): Promise<boolean> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const validRTId = await this.checkRevokedRefreshToken({
          userId,
          currentRT: refreshToken,
        });
        if (validRTId) {
          throw new BadRequestException('Valid refresh token!');
        }

        //hash RT
        const rfHash = await this.hashValue(refreshToken);
        // set expires date for RT
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expires);

        const typeOfLogin = googleId ? 'google' : 'local';
        //remove old RT if exist
        const countRemoved = await this.removeOldRefreshTokens(userId);
        console.log(countRemoved);
        if (countRemoved > 0) {
          console.log(
            `Removed ${countRemoved} old refresh tokens for user ${userId}`,
          );
        }

        // revoke old RT if exist
        const { count } = await tx.refreshToken.updateMany({
          where: { userId, typeLogin: typeOfLogin, isRevoked: false },
          data: { isRevoked: true },
        });
        console.log(count);
        if (count > 0) {
          console.log(`Revoke ${count} old refresh tokens for user ${userId}`);
        }
        // create new RF
        await tx.refreshToken.create({
          data: {
            token: rfHash,
            userId,
            expiresAt,
            typeLogin: typeOfLogin, // check if googleId exist to set typeLogin is google or local
          },
        });
        return true;
      });
    } catch (error) {
      throw new BadRequestException('Error saving refresh token!');
    }
  }

  async saveAccessTokenGoogle({
    googleId,
    accessToken,
  }: ATGoogleInput): Promise<boolean> {
    const atHash = await this.hashValue(accessToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration
    await this.prisma.accessTokenGoogle.create({
      data: {
        accessToken: atHash,
        googleId,
        expiresAt,
      },
    });
    return true;
  }

  private async rotateRefreshToken({
    userId,
    oldRTId,
    newRT,
  }: {
    userId: string;
    oldRTId: string;
    newRT: string;
  }): Promise<void> {
    const hashedNewRT = await this.hashValue(newRT);

    await this.saveRefreshToken({
      userId,
      refreshToken: hashedNewRT,
    });

    await this.revokeCurrentRefreshToken(oldRTId);
  }

  private async checkRevokedRefreshToken({
    userId,
    currentRT,
  }: {
    userId: string;
    currentRT: string;
  }): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User does not exist!');
    }
    const existingRT = await this.prisma.refreshToken.findMany({
      where: { userId },
    });
    if (!existingRT) {
      throw new NotFoundException(
        'Refresh token is not exist!, please login again!',
      );
    }

    // Check if the current refresh token matches any revoked token
    const matchedRevokedRT = existingRT.some(
      (rt) => this.verifyValue(currentRT, rt.token) && rt.isRevoked,
    );
    if (matchedRevokedRT) {
      await this.revokeAllRefreshTokens(userId);
      throw new BadRequestException(
        'Suspicious query detected: Refresh token has been compromised!',
      );
    }
    const RTIdsValid = existingRT
      .filter((rt) => this.verifyValue(currentRT, rt.token))
      .map((rt) => rt.id);

    return RTIdsValid[0];
  }

  private async revokeCurrentRefreshToken(
    currentRTId: string,
  ): Promise<boolean> {
    await this.prisma.refreshToken.updateMany({
      where: { id: currentRTId, isRevoked: false },
      data: { isRevoked: true },
    });

    return true;
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  private async removeOldRefreshTokens(
    userId: string,
    maxTokens: number = 5,
  ): Promise<number> {
    const tokens = await this.prisma.refreshToken.findMany({
      orderBy: { updatedAt: 'desc' },
      take: maxTokens,
      where: { userId },
    });

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        isRevoked: true,
        id: { notIn: tokens.map((t) => t.id) },
      },
    });
    return result.count;
  }

  async logout({
    userId,
    refreshToken,
  }: {
    userId: string;
    refreshToken: string;
  }): Promise<boolean> {
    const validRTId = await this.checkRevokedRefreshToken({
      userId,
      currentRT: refreshToken,
    });
    if (!validRTId) {
      throw new BadRequestException('Invalid refresh token!');
    }
    return await this.revokeCurrentRefreshToken(validRTId);
  }

  async changePassword({
    userId,
    currentPassword,
    newPassword,
    reNewPassword,
  }: ChangePasswordInput): Promise<boolean> {
    const existUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existUser) {
      throw new BadRequestException('User not found!');
    }
    const isCurrentPasswordValid = this.verifyValue(
      currentPassword,
      existUser.password as string,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect!');
    }
    if (newPassword.trim() !== reNewPassword.trim()) {
      throw new BadRequestException('New passwords do not match!');
    }
    const hashedNewPassword = await this.hashValue(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
    return true;
  }

  async resetPassword(id: string): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found!');
    }
    const newPassword = getRandomString(15);
    const hashedNewPassword = await this.hashValue(newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });
    return newPassword;
  }

  async forgotPassword({
    userId,
    newPassword,
    reNewPassword,
  }: ForgotPasswordInput): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found!');
    }
    if (newPassword.trim() !== reNewPassword.trim()) {
      throw new BadRequestException('New passwords do not match!');
    }
    const hashedNewPassword = await this.hashValue(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
    return true;
  }

  async setPassword({
    userId,
    newPassword,
    reNewPassword,
  }: SetPasswordInput): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found!');
    }
    if (!existingUser.googleId && existingUser.password) {
      throw new BadRequestException(
        'Available only for Google login users without a password set!',
      );
    }
    if (newPassword.trim() !== reNewPassword.trim()) {
      throw new BadRequestException('New passwords do not match!');
    }
    const hashedNewPassword = await this.hashValue(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
    return true;
  }

  async verifyEmail(email: string): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found!');
    }
    return existingUser.id;
  }

  async validateUserLocal(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'User not registered!, please register first!',
      );
    }
    if (user && user.googleId && !user.password) {
      throw new ConflictException(
        'User registered with Google,  please login with Google!',
      );
    }
    const comparePassword: boolean = bcrypt.compareSync(
      password,
      user.password as string,
    );
    if (user && !comparePassword) {
      throw new BadRequestException('Invalid password!');
    }
    if (user && comparePassword) {
      const { password: _, ...result } = user;
      return result;
    }
    throw new BadRequestException('Error login!');
  }

  async validateUserGoogle(
    googleUserInput: GoogleUserInput,
  ): Promise<Omit<User, 'password'> | null> {
    const { email, googleId, fullname, avatarUrl } = googleUserInput;
    let user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          fullname,
          avatarUrl,
          username: email.split('@')[0],
        },
      });
    }
    const { password: _, ...result } = user;
    return result;
  }
}
