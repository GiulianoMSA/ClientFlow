import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
  type GetClientsResponse,
} from '../services/clients.service';

import type {
  Client,
  ClientStatus,
  CreateClientData,
} from '../types/client';

function Clients() {
  const [clients, setClients] =
    useState<Client[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<ClientStatus | ''>('');

  const [pagination, setPagination] =
    useState<GetClientsResponse>({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  const [showForm, setShowForm] =
    useState(false);

  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [deletingClientId, setDeletingClientId] =
    useState<number | null>(null);

  const [formError, setFormError] =
    useState('');

  const [form, setForm] =
    useState<CreateClientData>({
      name: '',
      email: '',
      phone: '',
      company: '',
    });

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);
        setError('');

        const response = await getClients({
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined,
          status: status || undefined,
        });

        setClients(response.data);
        setPagination(response);
      } catch {
        setError(
          'Não foi possível carregar os clientes.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadClients();
  }, [
    pagination.page,
    pagination.limit,
    search,
    status,
  ]);

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }

  function handleStatusChange(
    value: ClientStatus | '',
  ) {
    setStatus(value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }

  function handleFormChange(
    field: keyof CreateClientData,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setEditingClient(null);

    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
    });

    setFormError('');
    setShowForm(true);
  }

  function openEditForm(
    client: Client,
  ) {
    setEditingClient(client);

    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      company: client.company ?? '',
    });

    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingClient(null);
    setFormError('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError(
        'O nome do cliente é obrigatório.',
      );

      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (editingClient) {
        await updateClient(
          editingClient.id,
          {
            name: form.name.trim(),
            email:
              form.email?.trim() ||
              undefined,
            phone:
              form.phone?.trim() ||
              undefined,
            company:
              form.company?.trim() ||
              undefined,
          },
        );
      } else {
        await createClient({
          name: form.name.trim(),
          email:
            form.email?.trim() ||
            undefined,
          phone:
            form.phone?.trim() ||
            undefined,
          company:
            form.company?.trim() ||
            undefined,
        });
      }

      const response = await getClients({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
      });

      setClients(response.data);
      setPagination(response);

      setShowForm(false);
      setEditingClient(null);

      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
      });
    } catch {
      setFormError(
        editingClient
          ? 'Não foi possível atualizar o cliente.'
          : 'Não foi possível criar o cliente.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    client: Client,
  ) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o cliente "${client.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingClientId(client.id);
      setError('');

      await deleteClient(client.id);

      const nextPage =
        pagination.page > 1 &&
        clients.length === 1
          ? pagination.page - 1
          : pagination.page;

      const response = await getClients({
        page: nextPage,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
      });

      setClients(response.data);
      setPagination(response);
    } catch {
      setError(
        'Não foi possível excluir o cliente.',
      );
    } finally {
      setDeletingClientId(null);
    }
  }

  function getStatusLabel(
    clientStatus: Client['status'],
  ) {
    switch (clientStatus) {
      case 'LEAD':
        return 'Lead';

      case 'ACTIVE':
        return 'Ativo';

      case 'INACTIVE':
        return 'Inativo';
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Clientes
          </h1>

          <p className="mt-1 text-gray-500">
            Gerencie seus clientes e leads.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Novo cliente
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingClient
                ? 'Editar cliente'
                : 'Novo cliente'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {editingClient
                ? 'Atualize os dados do cliente.'
                : 'Preencha os dados do novo cliente.'}
            </p>
          </div>

          {formError && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Nome"
                required
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange(
                      'name',
                      event.target.value,
                    )
                  }
                  placeholder="Nome do cliente"
                  className="form-input"
                  required
                />
              </FormField>

              <FormField label="Empresa">
                <input
                  type="text"
                  value={form.company}
                  onChange={(event) =>
                    handleFormChange(
                      'company',
                      event.target.value,
                    )
                  }
                  placeholder="Nome da empresa"
                  className="form-input"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    handleFormChange(
                      'email',
                      event.target.value,
                    )
                  }
                  placeholder="cliente@email.com"
                  className="form-input"
                />
              </FormField>

              <FormField label="Telefone">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) =>
                    handleFormChange(
                      'phone',
                      event.target.value,
                    )
                  }
                  placeholder="(00) 00000-0000"
                  className="form-input"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Salvando...'
                  : editingClient
                    ? 'Salvar alterações'
                    : 'Criar cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              handleSearchChange(
                event.target.value,
              )
            }
            placeholder="Buscar cliente..."
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={status}
            onChange={(event) =>
              handleStatusChange(
                event.target.value as
                  | ClientStatus
                  | '',
              )
            }
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              Todos os status
            </option>

            <option value="LEAD">
              Lead
            </option>

            <option value="ACTIVE">
              Ativo
            </option>

            <option value="INACTIVE">
              Inativo
            </option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <p className="text-sm text-gray-500">
              Carregando clientes...
            </p>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center">
            <p className="text-sm text-gray-500">
              Nenhum cliente encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Empresa
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contato
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {client.name}
                      </p>

                      {client.email && (
                        <p className="mt-1 text-sm text-gray-500">
                          {client.email}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.company || '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.phone || '—'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {getStatusLabel(
                          client.status,
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(client)
                          }
                          disabled={
                            deletingClientId ===
                            client.id
                          }
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              client,
                            )
                          }
                          disabled={
                            deletingClientId ===
                            client.id
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingClientId ===
                          client.id
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
        )}

        {!loading &&
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-gray-500">
                Página {pagination.page} de{' '}
                {pagination.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    setPagination(
                      (current) => ({
                        ...current,
                        page:
                          current.page - 1,
                      }),
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPagination(
                      (current) => ({
                        ...current,
                        page:
                          current.page + 1,
                      }),
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({
  label,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

export default Clients;