import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from '../services/tasks.service';

import { getClients } from '../services/clients.service';

import type {
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskData,
  UpdateTaskData,
} from '../types/task';

import type { Client } from '../types/client';

const PAGE_SIZE = 10;

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

function formatDate(date: string | null): string {
  if (!date) return 'Sem prazo';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(date));
}

function getStatusClasses(status: TaskStatus): string {
  switch (status) {
    case 'TODO':
      return 'bg-gray-100 text-gray-700';

    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700';

    case 'DONE':
      return 'bg-green-100 text-green-700';
  }
}

function getPriorityClasses(
  priority: TaskPriority,
): string {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-700';

    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700';

    case 'HIGH':
      return 'bg-red-100 text-red-700';
  }
}

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  clientId: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
  clientId: '',
};

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] =
    useState<TaskStatus | ''>('');
  const [priority, setPriority] =
    useState<TaskPriority | ''>('');

  const [dueDateFrom, setDueDateFrom] =
    useState('');
  const [dueDateTo, setDueDateTo] =
    useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [formData, setFormData] =
    useState<TaskFormData>(initialFormData);

  const [deletingTaskId, setDeletingTaskId] =
    useState<number | null>(null);

  async function loadTasks(
    page = pagination.page,
  ) {
    try {
      setLoading(true);
      setError('');

      const response = await getTasks({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        dueDateFrom: dueDateFrom
          ? `${dueDateFrom}T00:00:00.000Z`
          : undefined,
        dueDateTo: dueDateTo
          ? `${dueDateTo}T23:59:59.999Z`
          : undefined,
      });

      setTasks(response.data);
      setPagination(response);
    } catch {
      setError(
        'Não foi possível carregar as tarefas.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const response = await getClients({
        page: 1,
        limit: 100,
      });

      setClients(response.data);
    } catch {
      setError(
        'Não foi possível carregar os clientes.',
      );
    }
  }

  useEffect(() => {
    void loadTasks(1);
  }, [
    search,
    status,
    priority,
    dueDateFrom,
    dueDateTo,
  ]);

  useEffect(() => {
    void loadClients();
  }, []);

  function openCreateModal() {
    setEditingTask(null);
    setFormData(initialFormData);
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);

    setFormData({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : '',
      clientId:
        task.clientId !== null
          ? String(task.clientId)
          : '',
    });

    setError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingTask(null);
    setFormData(initialFormData);
  }

  function handleInputChange(
    field: keyof TaskFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingTask) {
        const data: UpdateTaskData = {
          title: formData.title.trim(),
          description:
            formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate
            ? new Date(
                `${formData.dueDate}T18:00:00`,
              ).toISOString()
            : null,
          clientId: formData.clientId
            ? Number(formData.clientId)
            : null,
        };

        await updateTask(
          editingTask.id,
          data,
        );
      } else {
        const data: CreateTaskData = {
          title: formData.title.trim(),
          description:
            formData.description.trim() || undefined,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate
            ? new Date(
                `${formData.dueDate}T18:00:00`,
              ).toISOString()
            : undefined,
          clientId: formData.clientId
            ? Number(formData.clientId)
            : undefined,
        };

        await createTask(data);
      }

      closeModal();

      await loadTasks(
        editingTask
          ? pagination.page
          : 1,
      );
    } catch {
      setError(
        editingTask
          ? 'Não foi possível atualizar a tarefa.'
          : 'Não foi possível criar a tarefa.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(task: Task) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a tarefa "${task.title}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingTaskId(task.id);
      setError('');

      await deleteTask(task.id);

      const nextPage =
        pagination.page > 1 &&
        tasks.length === 1
          ? pagination.page - 1
          : pagination.page;

      await loadTasks(nextPage);
    } catch {
      setError(
        'Não foi possível excluir a tarefa.',
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);
  }

  function handlePreviousPage() {
    if (pagination.page <= 1) return;

    void loadTasks(pagination.page - 1);
  }

  function handleNextPage() {
    if (
      pagination.page >=
      pagination.totalPages
    ) {
      return;
    }

    void loadTasks(pagination.page + 1);
  }

  function clearFilters() {
    setSearch('');
    setStatus('');
    setPriority('');
    setDueDateFrom('');
    setDueDateTo('');
  }

  const hasFilters =
    search ||
    status ||
    priority ||
    dueDateFrom ||
    dueDateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tarefas
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas tarefas e acompanhe seus prazos.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Nova tarefa
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label
              htmlFor="task-search"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Buscar
            </label>

            <input
              id="task-search"
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value,
                )
              }
              placeholder="Título ou descrição..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="task-status"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="task-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | TaskStatus
                    | '',
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              <option value="TODO">
                A fazer
              </option>
              <option value="IN_PROGRESS">
                Em andamento
              </option>
              <option value="DONE">
                Concluídas
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Prioridade
            </label>

            <select
              id="task-priority"
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as
                    | TaskPriority
                    | '',
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todas</option>
              <option value="LOW">
                Baixa
              </option>
              <option value="MEDIUM">
                Média
              </option>
              <option value="HIGH">
                Alta
              </option>
            </select>
          </div>

          <div className="flex items-end">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="due-date-from"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Vencimento a partir de
            </label>

            <input
              id="due-date-from"
              type="date"
              value={dueDateFrom}
              onChange={(event) =>
                setDueDateFrom(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="due-date-to"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Vencimento até
            </label>

            <input
              id="due-date-to"
              type="date"
              value={dueDateTo}
              onChange={(event) =>
                setDueDateTo(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Carregando tarefas...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              Nenhuma tarefa encontrada.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {hasFilters
                ? 'Tente alterar os filtros.'
                : 'Crie sua primeira tarefa para começar.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tarefa
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Cliente
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Prioridade
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Prazo
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="mt-1 max-w-md truncate text-sm text-gray-500">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {task.client?.name ?? (
                          <span className="text-gray-400">
                            Sem cliente
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            getStatusClasses(
                              task.status,
                            ),
                          ].join(' ')}
                        >
                          {
                            statusLabels[
                              task.status
                            ]
                          }
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            getPriorityClasses(
                              task.priority,
                            ),
                          ].join(' ')}
                        >
                          {
                            priorityLabels[
                              task.priority
                            ]
                          }
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(
                          task.dueDate,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(task)
                            }
                            disabled={
                              deletingTaskId ===
                              task.id
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                task,
                              )
                            }
                            disabled={
                              deletingTaskId ===
                              task.id
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingTaskId ===
                            task.id
                              ? 'Excluindo...'
                              : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-gray-500">
                {pagination.total === 0
                  ? 'Nenhuma tarefa'
                  : `Mostrando ${
                      (pagination.page - 1) *
                        pagination.limit +
                      1
                    }–${Math.min(
                      pagination.page *
                        pagination.limit,
                      pagination.total,
                    )} de ${
                      pagination.total
                    } tarefas`}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    handlePreviousPage
                  }
                  disabled={
                    pagination.page <= 1
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>

                <span className="flex items-center px-2 text-sm text-gray-500">
                  Página{' '}
                  {pagination.page} de{' '}
                  {Math.max(
                    pagination.totalPages,
                    1,
                  )}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTask
                    ? 'Editar tarefa'
                    : 'Nova tarefa'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingTask
                    ? 'Atualize os dados da tarefa.'
                    : 'Preencha os dados da nova tarefa.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-xl leading-none text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="task-title"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Título
                </label>

                <input
                  id="task-title"
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    handleInputChange(
                      'title',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Preparar proposta comercial"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Descrição
                </label>

                <textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(event) =>
                    handleInputChange(
                      'description',
                      event.target.value,
                    )
                  }
                  placeholder="Descreva a tarefa..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-form-status"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>

                  <select
                    id="task-form-status"
                    value={formData.status}
                    onChange={(event) =>
                      handleInputChange(
                        'status',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="TODO">
                      A fazer
                    </option>

                    <option value="IN_PROGRESS">
                      Em andamento
                    </option>

                    <option value="DONE">
                      Concluída
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-form-priority"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Prioridade
                  </label>

                  <select
                    id="task-form-priority"
                    value={formData.priority}
                    onChange={(event) =>
                      handleInputChange(
                        'priority',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="LOW">
                      Baixa
                    </option>

                    <option value="MEDIUM">
                      Média
                    </option>

                    <option value="HIGH">
                      Alta
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Prazo
                  </label>

                  <input
                    id="task-due-date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) =>
                      handleInputChange(
                        'dueDate',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-client"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Cliente
                  </label>

                  <select
                    id="task-client"
                    value={formData.clientId}
                    onChange={(event) =>
                      handleInputChange(
                        'clientId',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Sem cliente
                    </option>

                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Salvando...'
                    : editingTask
                      ? 'Salvar alterações'
                      : 'Criar tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;