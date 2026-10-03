import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService =
    app.get(ConfigService);

  const corsOrigin =
    configService.getOrThrow<string>(
      'CORS_ORIGIN',
    );

  const port =
    configService.get<number>('PORT') ?? 3000;

  app.enableCors({
    origin: corsOrigin,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  app.use(
    new HttpLoggerMiddleware().use.bind(
      new HttpLoggerMiddleware(),
    ),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ClientFlow API')
    .setDescription(
      'REST API for the ClientFlow client and task management platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token.',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup(
    'docs',
    app,
    document,
  );

  await app.listen(port);
}

bootstrap();