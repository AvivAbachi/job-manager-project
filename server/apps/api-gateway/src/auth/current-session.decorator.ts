import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface UserSession {
  session: { id: string; userId: string; [key: string]: unknown };
  user: { id: string; role?: string | null; [key: string]: unknown };
}

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<{ authSession: UserSession }>()
      .authSession,
);
