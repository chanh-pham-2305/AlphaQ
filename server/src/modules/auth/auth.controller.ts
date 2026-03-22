import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LocalAuthGuard } from './guards/login-user.guard';
import { LoginLocalUserDto } from './dtos/login-user.dto';
import { SuccessResponse } from './types/auth.type';
import { User } from 'src/generated/prisma/client';
import {
  type RequestWithAt,
  type RequestWithLocal,
  type RequestWithRt,
} from './types/request.type';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RtJWTAuthGuard } from './guards/rf-jwt-auth.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { AtJwtAuthGuard } from './guards/at-jwt-auth.guard';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { SetPasswordDto } from './dtos/set-password.dto';
import {
  Authenticated,
  GuestOnly,
  Public,
} from 'src/global/decorators/roles.decorator';
import { RolesGuard } from 'src/global/guards/roles.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(AtJwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST api/auth/register
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiCreatedResponse({ description: 'User registered successfully!' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Post('register')
  @GuestOnly()
  async register(@Body(new ValidationPipe()) user: RegisterUserDto) {
    const result = await this.authService.register(user);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully!',
      data: result,
    };
  }

  // POST api/auth/login
  @ApiOperation({ summary: 'Login with email and password' })
  @Post('login')
  @GuestOnly()
  @UseGuards(LocalAuthGuard)
  async loginEmail(
    @Body(new ValidationPipe()) userLogin: LoginLocalUserDto,
    @Req() req: RequestWithLocal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    SuccessResponse<{ accessToken: string; user: Omit<User, 'password'> }>
  > {
    const { accessToken, refreshToken } = await this.authService.loginEmail(
      req.user,
    );
    //save RT to cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Login with email successfully!',
      data: { accessToken, user: req.user },
    };
  }

  //Google login OAuth2
  @ApiOperation({ summary: 'Login with Google account' })
  @Get('google/login')
  @GuestOnly()
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {}

  @ApiOperation({ summary: 'Handle Google login redirect' })
  @Get('google/redirect')
  @GuestOnly()
  @UseGuards(GoogleAuthGuard)
  async handleGoogleRedirect(
    @Req() req: RequestWithLocal,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.loginEmail(
      req.user,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Login google successfully!',
      data: { accessToken, user: req.user },
    };
  }

  // POST api/auth/refresh-token
  @ApiOperation({ summary: 'Refresh authentication token' })
  @Post('refresh-token')
  @Public()
  @UseGuards(RtJWTAuthGuard)
  async refreshToken(@Req() req: RequestWithRt): Promise<SuccessResponse> {
    console.log(req.user);

    const result = await this.authService.refreshToken(req.user as any);
    return (
      result && {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully!',
      }
    );
  }

  // POST api/auth/reset-password
  @ApiOperation({ summary: 'Reset user password' })
  //UseGuards(AdminGuard)
  @Post('reset-password')
  @Public()
  async resetPassword(
    @Query('user_id') userId: string,
  ): Promise<SuccessResponse<{ newPassword: string }>> {
    const newPassword = await this.authService.resetPassword(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully!',
      data: { newPassword },
    };
  }

  // POST api/auth/forgot-password
  @ApiOperation({ summary: 'Request password reset' })
  @Post('forgot-password')
  @Public()
  async forgotPassword(
    @Query('user_id') userId: string,
    @Body(new ValidationPipe()) forGotPasswordDto: ForgotPasswordDto,
  ): Promise<SuccessResponse> {
    const { newPassword, reNewPassword } = forGotPasswordDto;
    await this.authService.forgotPassword({
      userId,
      newPassword,
      reNewPassword,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully!',
    };
  }

  // POST api/auth/change-password
  @ApiOperation({ summary: 'Change user password' })
  @UseGuards(AtJwtAuthGuard)
  @Post('change-password')
  @Authenticated()
  async changePassword(
    @Req() req: RequestWithAt,
    @Body(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponse> {
    const { userId } = req.user;
    const { currentPassword, newPassword, reNewPassword } = changePasswordDto;
    const result = await this.authService.changePassword({
      userId,
      currentPassword,
      newPassword,
      reNewPassword,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully!',
    };
  }

  // POST api/auth/set-password
  @ApiOperation({ summary: 'Set user password' })
  @UseGuards(AtJwtAuthGuard)
  @Post('set-password')
  @Authenticated()
  async setPassword(
    @Req() req: RequestWithAt,
    @Body(new ValidationPipe()) setPasswordDto: SetPasswordDto,
  ): Promise<SuccessResponse> {
    const { userId } = req.user;
    const { newPassword, reNewPassword } = setPasswordDto;
    await this.authService.setPassword({
      userId,
      newPassword,
      reNewPassword,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Password set successfully!',
    };
  }

  // POST api/auth/verify-email
  @ApiOperation({ summary: 'Verify if email is valid for registration' })
  @Post('verify-email')
  @Public()
  async verifyEmail(
    @Body('email') email: string,
  ): Promise<SuccessResponse<{ userId: string }>> {
    const userId = await this.authService.verifyEmail(email);
    return {
      statusCode: HttpStatus.OK,
      message: 'Email is valid!',
      data: { userId },
    };
  }

  // POST api/auth/logout
  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @UseGuards(AtJwtAuthGuard)
  @Post('logout')
  @Authenticated()
  async logout(
    @Req() req: RequestWithAt,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId } = req.user;
    const refreshToken = req.cookies['refreshToken'];
    const result = await this.authService.logout({ userId, refreshToken });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return (
      result && {
        statusCode: HttpStatus.OK,
        message: 'Logout successfully!',
      }
    );
  }
}
