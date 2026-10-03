import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';

import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [AuthModule, ActivitiesModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}