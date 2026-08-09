import { NestFactory } from '@nestjs/core';
import { JobsModule } from './jobs.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    JobsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.PORT ?? 3001),
      },
    },
  );
  await app.listen();
}
bootstrap();
