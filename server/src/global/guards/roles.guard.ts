import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLE_HIERARCHY, UserRole } from '../types/roles.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }
    console.log('ROLE REQUIRE::', requiredRoles);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('ROLE USER::', user);
    const userRole: UserRole = user?.role || 'GUEST';
    console.log('user role::', userRole);
    const userLevel = ROLE_HIERARCHY[userRole];
    // if (!user) {
    //   throw new ForbiddenException('Bạn cần đăng nhập để truy cập');
    // }

    const hasAccess = requiredRoles.some((requiredRole) => {
      const requiredLevel = ROLE_HIERARCHY[requiredRole];
      return userLevel >= requiredLevel;
    });

    if (!hasAccess) {
      if (userRole === 'GUEST') {
        throw new ForbiddenException(
          'Vui lòng đăng nhập để sử dụng tính năng này',
        );
      }
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hành động này',
      );
    }

    return true;
  }
}
