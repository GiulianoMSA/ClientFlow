import { api } from '../api/client';

import type { Activity } from '../types/activity';

export async function getActivities(): Promise<
  Activity[]
> {
  const response =
    await api.get<Activity[]>('/activities');

  return response.data;
}