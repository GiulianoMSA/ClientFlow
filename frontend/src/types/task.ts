export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE';

export type TaskPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export interface TaskClient {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  clientId: number | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  client: TaskClient | null;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  clientId?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  clientId?: number | null;
}