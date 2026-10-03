import { api } from '../api/client';

import type {
  CreateTaskData,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskData,
} from '../types/task';

export interface GetTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface GetTasksResponse {
  data: Task[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function getTasks(
  params?: GetTasksParams,
): Promise<GetTasksResponse> {
  const response =
    await api.get<GetTasksResponse>(
      '/tasks',
      { params },
    );

  return response.data;
}

export async function getTaskById(
  id: number,
): Promise<Task> {
  const response =
    await api.get<Task>(`/tasks/${id}`);

  return response.data;
}

export async function createTask(
  data: CreateTaskData,
): Promise<Task> {
  const response =
    await api.post<Task>(
      '/tasks',
      data,
    );

  return response.data;
}

export async function updateTask(
  id: number,
  data: UpdateTaskData,
): Promise<Task> {
  const response =
    await api.put<Task>(
      `/tasks/${id}`,
      data,
    );

  return response.data;
}

export async function deleteTask(
  id: number,
): Promise<void> {
  await api.delete(`/tasks/${id}`);
}