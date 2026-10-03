export interface DashboardClientStats {
  total: number;
  lead: number;
  active: number;
  inactive: number;
}

export interface DashboardTaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
  overdue: number;
}

export interface DashboardActivity {
  id: number;
  type: string;
  message: string;
  createdAt: string;
}

export interface DashboardData {
  clients: DashboardClientStats;
  tasks: DashboardTaskStats;
  recentActivities: DashboardActivity[];
}