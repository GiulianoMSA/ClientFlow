export type ClientStatus =
  | 'LEAD'
  | 'ACTIVE'
  | 'INACTIVE';

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}