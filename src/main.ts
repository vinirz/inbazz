import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/filters/http-interceptos.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Order Orchestrator')
    .setDescription(
      'API para orquestração de pedidos com processamento assíncrono via fila',
    )
    .setVersion('1.0')
    .addTag('orders', 'Gerenciamento de pedidos')
    .addTag('queue', 'Monitoramento da fila de processamento')
    .addApiKey(
      { type: 'apiKey', name: 'idempotency-key', in: 'header' },
      'idempotency-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'kepler',
    }),
  );

  await app.listen(3000);
}

void bootstrap();
