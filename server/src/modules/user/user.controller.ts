import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AtJwtAuthGuard } from '../auth/guards/at-jwt-auth.guard';
import { type RequestWithAt } from '../auth/types/request.type';
import { SuccessResponse } from '../auth/types/auth.type';
import { UserDto } from '@generated/nestjs-dto';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { GetUsersDto } from './dtos/get-users.dto';
import { PaginatedResponseDto } from './responses/paginated.response';
import { type UserRole } from 'src/global/types/roles.type';
import { RolesGuard } from 'src/global/guards/roles.guard';
import {
  AdminOnly,
  Authenticated,
  CustomerOnly,
} from 'src/global/decorators/roles.decorator';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AtJwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET api/user/me
  @Authenticated()
  @Get('me')
  async getProfile(
    @Req() req: RequestWithAt,
  ): Promise<
    SuccessResponse<
      Omit<
        UserDto,
        'id' | 'role' | 'password' | 'googleId' | 'createdAt' | 'updatedAt'
      >
    >
  > {
    const { userId } = req.user;
    const user = await this.userService.getProfile(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'get profile successfully!',
      data: user,
    };
  }

  // GET api/user
  @Get()
  @AdminOnly()
  async findAll(
    @Query() queryDto: GetUsersDto,
  ): Promise<SuccessResponse<PaginatedResponseDto<UserDto>>> {
    const { data, meta } = await this.userService.findAll(queryDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'get all users successfully!',
      data: {
        data,
        meta,
      },
    };
  }

  // GET api/user/:id
  @Get(':user_id')
  @AdminOnly()
  async findOne(
    @Param('user_id') userId: string,
  ): Promise<SuccessResponse<Omit<UserDto, 'updatedAt' | 'password'>>> {
    const user = await this.userService.findOne(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'get user successfully!',
      data: user,
    };
  }

  // POST api/user/:user_id/roles
  @Post(':user_id/roles')
  @AdminOnly()
  async addRole(
    @Param('user_id') userId: string,
    @Body() role: UserRole,
  ): Promise<SuccessResponse> {
    await this.userService.addRole({ userId, role });

    return { statusCode: HttpStatus.OK, message: 'updated role successfully!' };
  }
  // PATCH api/user/me
  @Patch('me')
  @CustomerOnly()
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Req() req: RequestWithAt,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({
            fileType: /(jpeg|png|gif|jpg|svg)$/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    avatar: Express.Multer.File,
    @Body(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
  ): Promise<
    SuccessResponse<
      Omit<
        UserDto,
        'password' | 'updatedAt' | 'googleId' | 'role' | 'createdAt'
      >
    >
  > {
    console.log('update profile controller', avatar);

    const { userId } = req.user;
    const result = await this.userService.update({
      userId,
      avatar,
      updateProfileDto,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'update Profile successfully!',
      data: result,
    };
  }

  // DELETE api/user/:id
  @Delete(':user_id')
  @AdminOnly()
  async deleteUserById(
    @Param('user_id') userId: string,
  ): Promise<SuccessResponse> {
    await this.userService.delete(userId);

    return { statusCode: HttpStatus.OK, message: 'delete user successfully!' };
  }
}
