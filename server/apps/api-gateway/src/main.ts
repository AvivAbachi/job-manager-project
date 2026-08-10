import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: [process.env.CLIENT_URL],
    credentials: true,
  });

  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: `http://${process.env.AUTH_HOST ?? 'localhost'}:${process.env.AUTH_PORT ?? 3002}/api/auth`,
    }),
  );

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
