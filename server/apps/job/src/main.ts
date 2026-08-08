import { NestFactory } from '@nestjs/core';
import { JobsModule } from './jobs.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    JobsModule,
    {
      bufferLogs: true,
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.PORT ?? 3001),
      },
    },
  );
  app.useLogger(app.get(Logger));
  await app.listen();
}
bootstrap();
