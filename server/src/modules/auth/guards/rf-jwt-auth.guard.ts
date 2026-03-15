import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RtJWTAuthGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const refreshToken = request.cookies?.refreshToken;
    console.log('RT in guard:', refreshToken);
    return super.canActivate(context);
  }
}
