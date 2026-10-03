import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return users.map(({ password: _, ...user }) => user);
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...result } = user;

    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(data: { email: string; password: string; name: string }) {
    const existingUser = await this.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    const { password: _, ...result } = user;

    return result;
  }

  async update(id: number, data: UpdateUserDto) {
    const user = await this.findById(id);

    const updateData: {
      email?: string;
      password?: string;
      name?: string;
    } = {};

    if (data.email !== undefined) {
      const existingUser = await this.findByEmail(data.email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already registered');
      }

      updateData.email = data.email;
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: updateData,
    });

    const { password: _, ...result } = updatedUser;

    return result;
  }
  
  async remove(id: number) {
    const user = await this.findById(id);

    await this.prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    return {
      message: 'User deleted successfully',
    };
  }
}