import {
  useEffect,
  useState,
} from 'react';

import { getDashboard } from '../services/dashboard.service';

import type { DashboardData } from '../types/dashboard';

function Dashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError('');

        const data = await getDashboard();

        setDashboard(data);
      } catch {
        setError(
          'Não foi possível carregar o dashboard.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">
          Carregando dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Visão geral
        </h2>

        <p className="mt-1 text-gray-500">
          Acompanhe seus clientes e tarefas.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {dashboard && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Clientes"
              value={dashboard.clients.total}
            />

            <StatCard
              title="Leads"
              value={dashboard.clients.lead}
            />

            <StatCard
              title="Clientes ativos"
              value={dashboard.clients.active}
            />

            <StatCard
              title="Tarefas"
              value={dashboard.tasks.total}
            />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Tarefas
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <StatItem
                  label="A fazer"
                  value={dashboard.tasks.todo}
                />

                <StatItem
                  label="Em andamento"
                  value={dashboard.tasks.inProgress}
                />

                <StatItem
                  label="Concluídas"
                  value={dashboard.tasks.done}
                />

                <StatItem
                  label="Alta prioridade"
                  value={dashboard.tasks.highPriority}
                />

                <StatItem
                  label="Atrasadas"
                  value={dashboard.tasks.overdue}
                />
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Clientes
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <StatItem
                  label="Total"
                  value={dashboard.clients.total}
                />

                <StatItem
                  label="Leads"
                  value={dashboard.clients.lead}
                />

                <StatItem
                  label="Ativos"
                  value={dashboard.clients.active}
                />

                <StatItem
                  label="Inativos"
                  value={dashboard.clients.inactive}
                />
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Atividades recentes
            </h3>

            {dashboard.recentActivities.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Nenhuma atividade recente.
              </p>
            ) : (
              <div className="mt-4 divide-y">
                {dashboard.recentActivities.map(
                  (activity) => (
                    <div
                      key={activity.id}
                      className="py-4"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(
                          activity.createdAt,
                        ).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
}

function StatItem({
  label,
  value,
}: StatItemProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

export default Dashboard;