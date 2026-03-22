import { UpdateUserDto, UserDto } from '@generated/nestjs-dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUsersDto } from './dtos/get-users.dto';
import { PaginatedResponseDto } from './responses/paginated.response';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async getProfile(
    userId: string,
  ): Promise<
    Omit<
      UserDto,
      'id' | 'role' | 'password' | 'googleId' | 'createdAt' | 'updatedAt'
    >
  > {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: {
        id: true,
        role: true,
        googleId: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
  async findOne(
    userId: string,
  ): Promise<Omit<UserDto, 'password' | 'updatedAt'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll(queryDto: GetUsersDto): Promise<PaginatedResponseDto<UserDto>> {
    const { page, limit, search, role, sortBy, sortOrder } = queryDto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;

    const orderBy = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    const totalPage = Math.floor(total / limit);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPage;
    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPage: totalPage,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
  async addRole({
    userId,
    role,
  }: {
    userId: string;
    role: string;
  }): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updateduser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: { push: role } },
    });
    return !!updateduser;
  }

  async update({
    userId,
    avatar,
    updateProfileDto,
  }: {
    userId: string;
    avatar: Express.Multer.File;
    updateProfileDto: UpdateProfileDto;
  }): Promise<
    Omit<UserDto, 'password' | 'googleId' | 'role' | 'createdAt' | 'updatedAt'>
  > {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatarUrl) {
      await this.cloudinary.deleteImage(user.avatarUrl);
    }
    const uploadedAvatar = await this.cloudinary.uploadImage({ file: avatar });

    //+ avatarUrl
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploadedAvatar, ...updateProfileDto },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullname: true,
        isVerified: true,
        username: true,
        avatarUrl: true,
        address: true,
        gender: true,
        birthDate: true,
      },
    });

    return updatedUser;
  }

  async delete(userId: string): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, avatarUrl: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await tx.user.delete({
        where: { id: userId },
      });

      if (user.avatarUrl) {
        try {
          await this.cloudinary.deleteImage(user.avatarUrl);
        } catch (cloudinaryError: any) {
          throw new Error(
            `Failed to delete avatar: ${cloudinaryError.message}`,
          );
        }
      }

      return true;
    });
  }
}
