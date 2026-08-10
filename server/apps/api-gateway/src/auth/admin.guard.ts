import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserSession } from './current-session.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { authSession?: UserSession }>();

    if (request.authSession?.user.role !== 'admin') {
      throw new ForbiddenException();
    }

    return true;
  }
}
