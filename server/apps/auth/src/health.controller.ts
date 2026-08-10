import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('health')
export class AuthHealthController {
  @Get()
  @AllowAnonymous()
  check() {
    return { status: 'ok' };
  }
}
