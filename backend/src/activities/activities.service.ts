import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '../generated/prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    type: ActivityType,
    message: string,
  ) {
    return this.prisma.activity.create({
      data: {
        userId,
        type,
        message,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.activity.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}