export type ActivityType =
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED';

export interface Activity {
  id: number;
  userId: number;
  type: ActivityType;
  message: string;
  createdAt: string;
}