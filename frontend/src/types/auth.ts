export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginCredentials {
  email: string;
  password: string;
}