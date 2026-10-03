import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { HttpLoggerMiddleware } from '../common/middleware/http-logger.middleware';

import { ClientsModule } from '../clients/clients.module';
import { TasksModule } from '../tasks/tasks.module';
import { ActivitiesModule } from '../activities/activities.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),

        CORS_ORIGIN: Joi.string().uri().required(),

        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().required(),

        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
      }),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ClientsModule,
    TasksModule,
    ActivitiesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes('*');
  }
}