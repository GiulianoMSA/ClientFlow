import { useEffect, useState } from 'react';

import { getActivities } from '../services/activities.service';

import type {
  Activity,
  ActivityType,
} from '../types/activity';

function formatActivityDate(
  date: string,
): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getActivityLabel(
  type: ActivityType,
): string {
  switch (type) {
    case 'CLIENT_CREATED':
      return 'Cliente criado';

    case 'CLIENT_UPDATED':
      return 'Cliente atualizado';

    case 'CLIENT_DELETED':
      return 'Cliente excluído';

    case 'TASK_CREATED':
      return 'Tarefa criada';

    case 'TASK_UPDATED':
      return 'Tarefa atualizada';

    case 'TASK_DELETED':
      return 'Tarefa excluída';
  }
}

function getActivityClasses(
  type: ActivityType,
): string {
  switch (type) {
    case 'CLIENT_CREATED':
    case 'TASK_CREATED':
      return 'bg-green-100 text-green-700';

    case 'CLIENT_UPDATED':
    case 'TASK_UPDATED':
      return 'bg-blue-100 text-blue-700';

    case 'CLIENT_DELETED':
    case 'TASK_DELETED':
      return 'bg-red-100 text-red-700';
  }
}

function getActivityIcon(
  type: ActivityType,
): string {
  switch (type) {
    case 'CLIENT_CREATED':
      return '+';

    case 'CLIENT_UPDATED':
      return '↻';

    case 'CLIENT_DELETED':
      return '×';

    case 'TASK_CREATED':
      return '+';

    case 'TASK_UPDATED':
      return '↻';

    case 'TASK_DELETED':
      return '×';
  }
}

function getActivityCategory(
  type: ActivityType,
): string {
  switch (type) {
    case 'CLIENT_CREATED':
    case 'CLIENT_UPDATED':
    case 'CLIENT_DELETED':
      return 'Cliente';

    case 'TASK_CREATED':
    case 'TASK_UPDATED':
    case 'TASK_DELETED':
      return 'Tarefa';
  }
}

function Activities() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  async function loadActivities() {
    try {
      setLoading(true);
      setError('');

      const response =
        await getActivities();

      setActivities(response);
    } catch {
      setError(
        'Não foi possível carregar as atividades.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadActivities();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Atividades
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Acompanhe o histórico de ações realizadas na sua conta.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Carregando atividades...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              Nenhuma atividade encontrada.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              As ações realizadas no sistema aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-4 px-6 py-5 transition hover:bg-gray-50"
              >
                <div
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold',
                    getActivityClasses(
                      activity.type,
                    ),
                  ].join(' ')}
                >
                  {getActivityIcon(
                    activity.type,
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                        getActivityClasses(
                          activity.type,
                        ),
                      ].join(' ')}
                    >
                      {getActivityCategory(
                        activity.type,
                      )}
                    </span>

                    <span className="text-xs text-gray-400">
                      {getActivityLabel(
                        activity.type,
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-800">
                    {activity.message}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {formatActivityDate(
                      activity.createdAt,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Activities;