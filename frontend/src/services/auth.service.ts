import axios from 'axios';

import { api } from '../api/client';

import type {
  LoginCredentials,
  LoginResponse,
} from '../types/auth';

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    '/auth/login',
    credentials,
  );

  return response.data;
}

export async function refreshToken(
  token: string,
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    'http://localhost:3000/auth/refresh',
    {
      refreshToken: token,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}