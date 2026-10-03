import { api } from '../api/client';

import type {
  Client,
  CreateClientData,
} from '../types/client';

export interface GetClientsParams {
  page?: number;
  limit?: number;
  status?: Client['status'];
  search?: string;
}

export interface GetClientsResponse {
  data: Client[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function getClients(
  params?: GetClientsParams,
): Promise<GetClientsResponse> {
  const response =
    await api.get<GetClientsResponse>(
      '/clients',
      {
        params,
      },
    );

  return response.data;
}

export async function createClient(
  data: CreateClientData,
): Promise<Client> {
  const response =
    await api.post<Client>(
      '/clients',
      data,
    );

  return response.data;
}

export async function updateClient(
  id: number,
  data: Partial<CreateClientData>,
): Promise<Client> {
  const response =
    await api.put<Client>(
      `/clients/${id}`,
      data,
    );

  return response.data;
}

export async function deleteClient(
  id: number,
): Promise<void> {
  await api.delete(`/clients/${id}`);
}