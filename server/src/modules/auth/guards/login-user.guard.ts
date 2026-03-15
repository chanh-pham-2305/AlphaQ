import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!this.preValidation(request.body)) {
      throw new BadRequestException('Invalid input format');
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  private preValidation(body: any): boolean {
    const { email, password } = body;
    return (
      email &&
      typeof email === 'string' &&
      email.includes('@') &&
      password &&
      typeof password === 'string'
    );
  }
}
