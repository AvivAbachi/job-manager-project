import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserSession } from './current-session.decorator';

type AuthenticatedRequest = Request & { authSession?: UserSession };

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authUrl = new URL(
      '/api/auth/get-session',
      `http://${process.env.AUTH_HOST ?? 'localhost'}:${process.env.AUTH_PORT ?? 3002}`,
    );
    const response = await fetch(authUrl, {
      headers: request.headers.cookie ? { cookie: request.headers.cookie } : {},
    }).catch(() => undefined);

    if (!response?.ok) throw new UnauthorizedException();

    const session = (await response.json()) as UserSession | null;
    if (!session?.user?.id || !session.session?.userId) {
      throw new UnauthorizedException();
    }

    request.authSession = session;
    return true;
  }
}
