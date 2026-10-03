import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';

import { ActivityType } from '../generated/prisma/client';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findAll(userId: number, query: FindClientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      ownerId: userId,
      ...(query.status
        ? {
            status: query.status,
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                company: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: {
          id: 'asc',
        },
        skip,
        take: limit,
      }),

      this.prisma.client.count({
        where,
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, userId: number) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async create(userId: number, data: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        ownerId: userId,
      },
    });

    await this.activitiesService.create(
      userId,
      ActivityType.CLIENT_CREATED,
      `Client "${client.name}" created.`
    );

    return client;

  }

  async update(
    id: number,
    userId: number,
    data: UpdateClientDto,
  ) {
    await this.findById(id, userId);

    const client = await this.prisma.client.update({
      where: {
        id,
      },
      data,
    });

    await this.activitiesService.create(
      userId,
      ActivityType.CLIENT_UPDATED,
      `Client "${client.name}" updated.`
    );

    return client
  }

  async remove(id: number, userId: number) {
    await this.findById(id, userId);

    const client = await this.prisma.client.delete({
      where: {
        id,
      },
    });

    await this.activitiesService.create(
      userId,
      ActivityType.CLIENT_DELETED,
      `Client "${client.name}" deleted`,
    );

    return {
      message: 'Client deleted successfully',
    };
  }
}