import { UserRole } from '../../generated/prisma/client';

export interface JwtPayload {
  name: string;
  sub: number;
  email: string;
  role: UserRole;
}