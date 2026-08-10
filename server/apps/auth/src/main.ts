import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthAppModule } from './auth-app.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthAppModule, { bodyParser: false });
  const logger = new Logger('HTTP');

  app.use((request, response, next) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
