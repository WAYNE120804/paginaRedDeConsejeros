import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      return true;
    }

    return true;
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      return null as TUser;
    }

    return user;
  }
}
